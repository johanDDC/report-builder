package com.almworks.dyoma.crm.baseServer;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;

import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.ext.MessageBodyReader;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Provider;
import java.io.*;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

/**
 * @author dyoma
 */
@Provider
@Consumes({MediaType.APPLICATION_JSON, "text/json"})
@Produces({MediaType.APPLICATION_JSON, "text/json"})
public class GsonJerseyProvider implements MessageBodyWriter<Object>,
  MessageBodyReader<Object> {

  private static final Charset UTF_8 = StandardCharsets.UTF_8;
  public static final Gson GSON = new GsonBuilder()
    .registerTypeAdapter(Instant.class, GsonUtils.ISO_INSTANT)
    .excludeFieldsWithoutExposeAnnotation()
    .serializeNulls()
    .create();

  @Override
  public boolean isReadable(Class<?> type, Type genericType,
                            java.lang.annotation.Annotation[] annotations, MediaType mediaType) {
    return true;
  }

  @Override
  public Object readFrom(Class<Object> type, Type genericType,
                         Annotation[] annotations, MediaType mediaType,
                         MultivaluedMap<String, String> httpHeaders, InputStream entityStream)
    throws IOException {
    try (InputStreamReader streamReader = new InputStreamReader(entityStream, UTF_8)) {
      return GSON.fromJson(streamReader, genericType);
    } catch (JsonSyntaxException e) {
      e.printStackTrace();
    }
    return null;
  }

  @Override
  public boolean isWriteable(Class<?> type, Type genericType, Annotation[] annotations, MediaType mediaType) {
    return true;
  }

  @Override
  public long getSize(Object object, Class<?> type, Type genericType, Annotation[] annotations, MediaType mediaType) {
    return -1;
  }

  @Override
  public void writeTo(Object object, Class<?> type, Type genericType,
                      Annotation[] annotations, MediaType mediaType,
                      MultivaluedMap<String, Object> httpHeaders,
                      OutputStream entityStream) throws IOException, WebApplicationException {
    try (OutputStreamWriter writer = new OutputStreamWriter(entityStream, UTF_8)) {
      GSON.toJson(object, genericType, writer);
    }
  }
}

