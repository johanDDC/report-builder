package com.almworks.dyoma.crm.baseServer.server;

import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 * @author dyoma
 */
@Path("server")
@Consumes({MediaType.APPLICATION_JSON, "text/json"})
@Produces({MediaType.APPLICATION_JSON, "text/json"})
public class RestServerController {
  private final DummyServerController myController;

  @Inject
  public RestServerController(DummyServerController controller) {
    myController = controller;
  }

  @POST
  @Path("shutdown")
  public Response shutdown() {
    myController.shutdown();
    return Response.status(Response.Status.NO_CONTENT).build();
  }
}
