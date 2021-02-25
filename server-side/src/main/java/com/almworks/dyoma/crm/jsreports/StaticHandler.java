package com.almworks.dyoma.crm.jsreports;

import org.glassfish.grizzly.Buffer;
import org.glassfish.grizzly.WriteHandler;
import org.glassfish.grizzly.http.io.NIOOutputStream;
import org.glassfish.grizzly.http.server.Request;
import org.glassfish.grizzly.http.server.Response;
import org.glassfish.grizzly.http.server.StaticHttpHandlerBase;
import org.glassfish.grizzly.http.util.Header;
import org.glassfish.grizzly.http.util.HttpStatus;
import org.glassfish.grizzly.memory.BufferArray;
import org.glassfish.grizzly.memory.MemoryManager;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * @author dyoma
 */
@SuppressWarnings("WeakerAccess")
public class StaticHandler extends StaticHttpHandlerBase {
  private final Map<String, Source> myFsRoots = new HashMap<>();
  private final Map<String, Source> myFiles = new HashMap<>();
  private final List<String> myIgnorePaths = new ArrayList<>();
  private Function<String, Source> myLastResort = null;

  /**
   * If a request URI starts with the prefix, this handler will look for a source under the fsRoot searching for tail of the URI.
   * This makes all sources under the sfRoot available via HTTP requests
   * @see #addResource(String, Source)
   */
  @NotNull
  public StaticHandler addRoot(String prefix, Source source) {
    myFsRoots.put(prefix, source);
    return this;
  }

  /**
   * Registers a single file at the specified path.
   * This registration precedes {@link #addRoot(String, Source)} and may override files under a sfRoot.
   * It overrides sfRoot resources even when the file does not exist at time of a request.
   */
  @NotNull
  public StaticHandler addResource(String path, Source source) {
    myFiles.put(path, source);
    return this;
  }

  /**
   * Works together with {@link #lastResort(Source)}.
   * If a requested resource path start with the prefix - DOES NOT fallback to a last resort and fails.
   */
  public StaticHandler ignorePath(String path) {
    if (!path.startsWith("/")) path = "/" + path;
    myIgnorePaths.add(path);
    return this;
  }

  /**
   * Returns this file is no other rule matches a requested resource and the resource is not {@link #ignorePath(String) ignored}.<br>
   * If any previous rule match even with not {@link File#exists() existing} file, the rule DOES NOT work.
   */
  @NotNull
  public StaticHandler lastResort(Source source) {
    myLastResort = s -> source;
    return this;
  }

  @Override
  protected boolean handle(String uri, Request request, Response response) throws Exception {
    Source resource = myFiles.get(uri);
    if (resource == null) {
      for (Map.Entry<String, Source> e : myFsRoots.entrySet()) {
        String prefix = e.getKey();
        if (uri.startsWith(prefix)) {
          Source fsRoot = e.getValue();
          String path = uri.substring(prefix.length());
          resource = fsRoot.subSource(path);
          break;
        }
      }
    }
    if (resource == null && myLastResort != null && myIgnorePaths.stream().noneMatch(uri::startsWith))
        resource = myLastResort.apply(uri);
    if (resource == null) return false;
    try {
      return resource.sendTo(uri, request, response);
    } catch (IOException e) {
      e.printStackTrace();
      throw e;
    }
  }

  /**
   * This interface abstracts source of a static resource or "resource directory".<br>
   * An implementation may represent file system based sources. In this case every source is a file (or directory)<br>
   * Sources may be "not-existing" - these sources do not represent any data, they should return false on {@link #sendTo(String, Request, Response)}
   */
  public interface Source {
    /**
     * Constructs child source. Assumes that this source is a "directory".
     * This method may return "not-existing" sources.
     * @param path part of URI path. Path elements are delimited with '/
     * @return a descendant source or null if the source does not exist,
     */
    @Nullable
    Source subSource(String path);

    /**
     * Sends content of the source to the response object.
     * This method is responsible for setting HTTP headers those describes media type and caching policies.
     * @param uri original requested URI
     * @return true if the content has been set. False if this source is a "not-existing" source
     */
    boolean sendTo(String uri, Request request, Response response) throws IOException;

    /**
     * This is a convenient method to check ETag HTTP header
     * @param eTag eTag value of current content
     * @return true if {@link HttpStatus#NOT_MODIFIED_304} status code is sent to the response.
     * true means that request processing is completed and the caller has nothing to do on the request.<br>
     * false means that ETag does not match and the caller has to sent new content to the response object
     */
    static boolean checkETag(Request request, Response response, String eTag) {
      String ifNoneMatch = request.getHeader(Header.IfNoneMatch);
      if (eTag.equals(ifNoneMatch)) {
        response.setStatus(HttpStatus.NOT_MODIFIED_304);
        return true;
      }
      response.setHeader(Header.ETag, eTag);
      return false;
    }
  }

  public static class FsSource implements Source {
    private final File myFile;

    public FsSource(File file) {
      myFile = file;
    }

    @Override
    public FsSource subSource(String path) {
      return new FsSource(new File(myFile, path));
    }

    @Override
    public boolean sendTo(String uri, Request request, Response response) throws IOException {
      if (!myFile.exists()) return false;
      FsSource source;
      if (myFile.isDirectory()) {
        if (!uri.endsWith("/")) { // redirect to the same url, but with trailing slash
          response.setStatus(HttpStatus.MOVED_PERMANENTLY_301);
          response.setHeader(Header.Location,
            response.encodeRedirectURL(uri + "/"));
          return true;
        }
        source = subSource("index.html");
      } else source = this;
      return source.doSend(request, response);
    }

    private boolean doSend(Request request, Response response) throws IOException {
      if (!myFile.isFile()) return false;
      long length = myFile.length();
      long lastModified = myFile.lastModified();
      if (lastModified == 0) throw new IllegalArgumentException(myFile.getAbsolutePath());
      String eTag = String.format("\"%s-%s\"", length, lastModified);
      if (Source.checkETag(request, response, eTag)) return true;
      response.addDateHeader(Header.LastModified, myFile.lastModified());
      StaticHttpHandlerBase.pickupContentType(response, myFile.getName());
      StaticHttpHandlerBase.sendFile(response, myFile);
      return true;
    }
  }

  public static class ResourceSource implements Source {
    private final ClassLoader myClassLoader;
    private final String myPath;
    private final String myETag;

    public ResourceSource(ClassLoader classLoader, String path) {
      myClassLoader = classLoader;
      myPath = path;
      myETag = String.valueOf(System.currentTimeMillis());
    }

    @Override
    public Source subSource(String path) {
      StringBuilder fullPath = new StringBuilder(myPath);
      if (!myPath.endsWith("/")) fullPath.append('/');
      while (path.startsWith("/")) path = path.substring(1);
      fullPath.append(path);
      return new ResourceSource(myClassLoader, fullPath.toString());
    }

    @Override
    public boolean sendTo(String uri, Request request, Response response) {
      if (Source.checkETag(request, response, myETag)) return true;
      StaticHttpHandlerBase.pickupContentType(response, myPath);
      InputStream stream = myClassLoader.getResourceAsStream(myPath);
      if (stream == null) return false;
      sendResource(response, stream);
      return true;
    }

    private static void sendResource(final Response response,
                                     final InputStream input) {
      response.setStatus(HttpStatus.OK_200);

      response.addDateHeader(Header.Date, System.currentTimeMillis());
      final int chunkSize = 8192;

      response.suspend();

      final NIOOutputStream outputStream = response.getNIOOutputStream();

      outputStream.notifyCanWrite(
        new NonBlockingDownloadHandler(response, outputStream, input, chunkSize));
    }

    private static class NonBlockingDownloadHandler implements WriteHandler {
      private final Response response;
      private final NIOOutputStream outputStream;
      private final InputStream inputStream;
      private final MemoryManager mm;
      private final int chunkSize;

      NonBlockingDownloadHandler(final Response response,
                                 final NIOOutputStream outputStream,
                                 final InputStream inputStream, final int chunkSize) {

        this.response = response;
        this.outputStream = outputStream;
        this.inputStream = inputStream;
        mm = response.getRequest().getContext().getMemoryManager();
        this.chunkSize = chunkSize;
      }

      @Override
      public void onWritePossible() throws Exception {
        // send CHUNK of data
        final boolean isWriteMore = sendChunk();

        if (isWriteMore) {
          // if there are more bytes to be sent - reregister this WriteHandler
          outputStream.notifyCanWrite(this);
        }
      }

      @Override
      public void onError(Throwable t) {
        t.printStackTrace();
        response.setStatus(500, t.getMessage());
        complete(true);
      }

      /**
       * Send next CHUNK_SIZE of file
       */
      private boolean sendChunk () throws IOException {
        // allocate Buffer
        Buffer buffer = null;

        if (!mm.willAllocateDirect(chunkSize)) {
          buffer = mm.allocate(chunkSize);
          final int len;
          if (!buffer.isComposite()) {
            len = inputStream.read(buffer.array(),
              buffer.position() + buffer.arrayOffset(),
              chunkSize);
          } else {
            final BufferArray bufferArray = buffer.toBufferArray();
            final int size = bufferArray.size();
            final Buffer[] buffers = bufferArray.getArray();

            int lenCounter = 0;
            for (int i = 0; i < size; i++) {
              final Buffer subBuffer = buffers[i];
              final int subBufferLen = subBuffer.remaining();
              final int justReadLen = inputStream.read(subBuffer.array(),
                subBuffer.position() + subBuffer.arrayOffset(),
                subBufferLen);

              if (justReadLen > 0) {
                lenCounter += justReadLen;
              }

              if (justReadLen < subBufferLen) {
                break;
              }
            }

            bufferArray.restore();
            bufferArray.recycle();

            len = lenCounter > 0 ? lenCounter : -1;
          }

          if (len > 0) {
            buffer.position(buffer.position() + len);
          } else {
            buffer.dispose();
            buffer = null;
          }
        } else {
          final byte[] buf = new byte[chunkSize];
          final int len = inputStream.read(buf);
          if (len > 0) {
            buffer = mm.allocate(len);
            buffer.put(buf);
          }
        }

        if (buffer == null) {
          complete(false);
          return false;
        }
        // mark it available for disposal after content is written
        buffer.allowBufferDispose(true);
        buffer.trim();

        // write the Buffer
        outputStream.write(buffer);

        return true;
      }

      /**
       * Complete the download
       */
      private void complete(final boolean isError) {
        try {
          inputStream.close();
        } catch (IOException e) {
          if (!isError) {
            response.setStatus(500, e.getMessage());
          }
        }

        try {
          outputStream.close();
        } catch (IOException e) {
          if (!isError) {
            response.setStatus(500, e.getMessage());
          }
        }

        if (response.isSuspended()) {
          response.resume();
        } else {
          response.finish();
        }
      }
    }
  }

  public static class BaseHelper {
    private final StaticHandler myHandler;

    public BaseHelper(StaticHandler handler) {
      myHandler = handler;
    }

    protected void priDefault(Source source) {
      myHandler.addResource("", source);
      myHandler.addResource("/", source);
    }

    protected void priIgnorePath(String path) {
      myHandler.ignorePath(prependSlash(path));
    }

    protected void priAddRoot(String path, Source srcRoot) {
      myHandler.addRoot(prependSlash(path), srcRoot);
    }

    protected void priAddResource(String path, Source srcResource) {
      myHandler.addResource(prependSlash(path), srcResource);
    }

    @NotNull
    private String prependSlash(String path) {
      String uriPath = path;
      if (!uriPath.startsWith("/")) uriPath = "/" + uriPath;
      return uriPath;
    }

    public StaticHandler getHandler() {
      return myHandler;
    }
  }

  public static class FileHelper extends BaseHelper {
    public FileHelper(StaticHandler handler) {
      super(handler);
    }

    public FileHelper setDefault(File file) {
      priDefault(new FsSource(file));
      return this;
    }

    public FileHelper addSfRoot(String path, File fsRoot) {
      priAddRoot(path, new FsSource(fsRoot));
      return this;
    }

    public FileHelper addFile(String path, File fsFile) {
      priAddResource(path, new FsSource(fsFile));
      return this;
    }

    public FileHelper ignorePath(String path) {
      priIgnorePath(path);
      return this;
    }

    public FileHelper lastResort(File file) {
      getHandler().lastResort(new FsSource(file));
      return this;
    }
  }

  public static class ClHelper extends BaseHelper {
    private final ClassLoader myClassLoader;
    private final String myRootPath;

    public ClHelper(StaticHandler handler, ClassLoader classLoader, String rootPath) {
      super(handler);
      myClassLoader = classLoader;
      while (rootPath.endsWith("//")) rootPath = rootPath.substring(0, rootPath.length() - 1);
      if (!rootPath.endsWith("/")) rootPath = rootPath + "/";
      myRootPath = rootPath;
    }

    public static ClHelper create(Class<?> aClass) {
      String root = aClass.getPackage().getName().replace('.', '/');
      return new ClHelper(new StaticHandler(), aClass.getClassLoader(), root);
    }

    public ClHelper setDefault(String path) {
      priDefault(source(path));
      return this;
    }

    public ClHelper addSfRoot(String path) {
      priAddRoot(path, source(path));
      return this;
    }

    public ClHelper addFile(String path) {
      priAddResource(path, source(path));
      return this;
    }

    public ClHelper addFile(String uriPath, String resourcePath) {
      priAddResource(uriPath, source(resourcePath));
      return this;
    }

    public ClHelper ignorePath(String path) {
      getHandler().ignorePath(path);
      return this;
    }

    public ClHelper lastResort(String path) {
      getHandler().lastResort(source(path));
      return this;
    }

    private ResourceSource source(String subPath) {
      while (subPath.startsWith("/")) subPath = subPath.substring(1);
      return new ResourceSource(myClassLoader, myRootPath + subPath);
    }
  }
}
