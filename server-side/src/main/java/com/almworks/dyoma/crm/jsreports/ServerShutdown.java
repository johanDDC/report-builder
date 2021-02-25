package com.almworks.dyoma.crm.jsreports;

import org.glassfish.grizzly.CompletionHandler;
import org.glassfish.grizzly.GrizzlyFuture;
import org.glassfish.grizzly.http.server.HttpServer;

/**
 * @author dyoma
 */
class ServerShutdown implements CompletionHandler<HttpServer> {
  private final long myStart = System.currentTimeMillis();

  static void shutdown(HttpServer server) throws InterruptedException {
    GrizzlyFuture<HttpServer> future = server.shutdown();
    ServerShutdown shutdown = new ServerShutdown();
    shutdown.waitForCompletion(future);
  }

  private void waitForCompletion(GrizzlyFuture<HttpServer> future) throws InterruptedException {
    future.addCompletionHandler(this);
    while (!future.isDone()) {
      long duration = System.currentTimeMillis() - myStart;
      if (duration > 300) System.err.println(String.format("Waiting for shutdown for: %sms", duration));
      synchronized (this) {
        wait(1000);
      }
    }
  }

  private void notifyLock() {
    synchronized (this) {
      this.notifyAll();
    }
  }

  public void cancelled() {
    System.err.println("Shutdown cancelled");
    notifyLock();
  }

  public void failed(Throwable throwable) {
    System.err.println("Shutdown failed");
    notifyLock();
  }

  public void completed(HttpServer httpServer) {
    System.err.println("Shutdown completed");
    notifyLock();
  }

  public void updated(HttpServer httpServer) {
  }
}
