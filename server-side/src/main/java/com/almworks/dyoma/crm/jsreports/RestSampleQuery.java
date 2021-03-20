package com.almworks.dyoma.crm.jsreports;

import com.google.gson.*;
import org.bson.json.JsonParseException;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("db")
@Consumes({MediaType.APPLICATION_JSON, "text/json"})
@Produces({MediaType.APPLICATION_JSON, "text/json"})
public class RestSampleQuery {
    private final MongoQueryComponent myComponent;
    public static final CacheControl NO_CACHE = new CacheControl();

    static {
        NO_CACHE.setNoCache(true);
        NO_CACHE.setNoStore(true);
    }

    @Inject
    public RestSampleQuery(MongoQueryComponent component) {
        myComponent = component;
    }

    @Path("{collectionName}/query")
    @GET
    public Response querryCollectionGET(@PathParam("collectionName") String collectionName,
                                        @QueryParam("query") String queryJson) {
        if (queryJson == null || queryJson.equals("")) {
            queryJson = "{}";
        }
        Response.ResponseBuilder response;
        try {
            String payload = myComponent.queryCollection(collectionName, queryJson);
            response = Response.ok().entity(payload);
        } catch (JsonParseException jsonParseException) {
            response = Response.status(Response.Status.BAD_REQUEST);
        }
        return response.cacheControl(NO_CACHE).build();
    }

    @Path("{collectionName}/query")
    @POST
    @Consumes({MediaType.APPLICATION_JSON})
    public Response querryCollectionPOST(@PathParam("collectionName") String collectionName, String json) {
        String queryJson = ((JsonObject) JsonParser.parseString(json)).get("query").toString();
        try {
            String payload = myComponent.queryCollection(collectionName, queryJson);
            return Response.ok().entity(payload).build();
        } catch (JsonParseException jsonParseException) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
    }
}
