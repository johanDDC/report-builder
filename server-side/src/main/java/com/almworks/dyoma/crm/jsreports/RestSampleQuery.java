package com.almworks.dyoma.crm.jsreports;

import com.google.gson.*;
import org.bson.json.JsonParseException;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("db")
@Consumes({MediaType.APPLICATION_JSON, "text/json"})
@Produces({MediaType.APPLICATION_JSON, "text/json"})
public class RestSampleQuery {
//    private final MongoQueryComponent myComponent;

//    @Inject
//    public RestSampleQuery(MongoQueryComponent component) {
//        myComponent = component;
//    }

    @Path("/{collectionName}/query")
    @GET
    public Response querryCollection(@PathParam("collectionName") String collectionName,
                                     @QueryParam("query") String queryJson) {
//            myComponent.queryCollection(collectionName, JsonParser.parseString(queryJson));
        try {
            JsonArray payload = MongoQueryComponent.queryCollection(collectionName, queryJson);
            return Response.ok().entity(payload).build();
        } catch (JsonParseException jsonParseException) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
    }
}
