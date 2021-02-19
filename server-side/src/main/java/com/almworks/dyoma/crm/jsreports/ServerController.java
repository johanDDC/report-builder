package com.almworks.dyoma.crm.jsreports;

import jakarta.inject.Singleton;
import org.glassfish.jersey.spi.Contract;

/**
 * @author dyoma
 */
@Singleton
@Contract
public class ServerController {
  private final Object myShutdownLock = new Object();
  private Integer myExitCode = null;

  public int waitForShutdown() throws InterruptedException {
    while (true) {
      synchronized (myShutdownLock) {
        if (myExitCode != null) return myExitCode;
        myShutdownLock.wait(1000);
      }
    }
  }

  /**
   * Requests server shutdown and exit process with the specified exit code
   * @param exitCode {@link System#exit(int) exit code}
   */
  public void shutdown(int exitCode) {
    synchronized (myShutdownLock) {
      if (myExitCode == null) {
        myExitCode = exitCode;
        myShutdownLock.notify();
        return;
      }
    }
    System.out.println("Shutdown already requested");
  }
}
