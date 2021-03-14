package com.almworks.dyoma.crm.jsreports.server;

import org.glassfish.jersey.spi.Contract;

import javax.inject.Singleton;

/**
 * @author dyoma
 */
@Singleton
@Contract
public class DummyServerController {
  private final Runnable myShutdown;

  public DummyServerController(Runnable shutdown) {
    myShutdown = shutdown;
  }

  public void shutdown() {
    myShutdown.run();
  }
}
