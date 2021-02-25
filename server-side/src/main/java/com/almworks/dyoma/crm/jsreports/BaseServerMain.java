package com.almworks.dyoma.crm.jsreports;

import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.grizzly.http.server.NetworkListener;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.server.ResourceConfig;
import org.jetbrains.annotations.NotNull;

import java.net.URI;

/**
 * @author dyoma
 */
@SuppressWarnings("WeakerAccess")
public abstract class BaseServerMain {
  private static final URI BASE_URI = URI.create("http://" + NetworkListener.DEFAULT_NETWORK_HOST + ":8080/");
  private URI myBaseUri = BASE_URI;
  private String myRestPath = "/rest/api/v1/";

  public BaseServerMain setBaseUri(URI baseUri) {
    myBaseUri = baseUri;
    return this;
  }

  public BaseServerMain setRestPath(String restPath) {
    myRestPath = restPath;
    return this;
  }

  /**
   * Subclass may perform additional initialization from command line parameters.
   * Implementations should throw an exception if init has failed
   */
  protected void initServer() throws Exception { }

  public int launch() throws Exception {
    initServer();
    return runServer();
  }

  private int runServer() throws InterruptedException {
    URI restBaseUrl = myBaseUri.resolve(myRestPath);
    ResourceConfig rc = new ResourceConfig();
    rc.register(GsonJerseyProvider.class);
//    rc.register(MultiPartFeature.class);
    ServerController controller = new ServerController();
    rc.register(controller, ServerController.class);
    registerComponents(rc);
    HttpServer server = GrizzlyHttpServerFactory.createHttpServer(restBaseUrl, rc);
    server.getServerConfiguration().addHttpHandler(createStaticHandler(), "/");
    System.out.println("Server started at: http://localhost:" + myBaseUri.getPort() + "/");
    int exitCode = controller.waitForShutdown();
    System.out.println("Shutting down...");
    ServerShutdown.shutdown(server);
    return exitCode;
  }

  protected abstract void registerComponents(ResourceConfig rc);


  @NotNull
  protected abstract HttpHandler createStaticHandler();
}
