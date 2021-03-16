package com.almworks.dyoma.crm.baseServer;


import com.google.gson.JsonObject;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

@Path("helloWorld")
@Consumes({MediaType.APPLICATION_JSON, "text/json"})
@Produces({MediaType.APPLICATION_JSON, "text/json"})
public class HelloWorldServerComponent {
  public static final CacheControl NO_CACHE = new CacheControl();
  static {
    NO_CACHE.setNoCache(true);
    NO_CACHE.setNoStore(true);
  }

  @GET
  @Path("")
  public Response get() {
    JsonObject payload = new JsonObject();
    payload.addProperty("message", "Hello World!");
    payload.addProperty("time", DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
    return Response.ok()
      .cacheControl(NO_CACHE)
      .entity(payload)
      .build();
  }
}
