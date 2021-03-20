package com.almworks.dyoma.crm.jsreports;

import com.almworks.dyoma.crm.baseServer.BaseServerMain;
import com.almworks.dyoma.crm.baseServer.StaticHandler;
import com.almworks.dyoma.crm.jsreports.samples.HelloWorldServerComponent;
import com.almworks.dyoma.crm.jsreports.samples.RestServerController;
import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.jersey.server.ResourceConfig;
import org.jetbrains.annotations.NotNull;

public class Server extends BaseServerMain {
    @Override
    protected void registerComponents(ResourceConfig rc) {
        rc.registerClasses(HelloWorldServerComponent.class, RestServerController.class, RestSampleQuery.class);
        MongoQueryComponent queryComponent = new MongoQueryComponent("mongodb://127.0.0.1:27017", "netflix");
        rc.register(queryComponent, MongoQueryComponent.class);
    }

    @Override
    protected @NotNull HttpHandler createStaticHandler() {
        return StaticHandler.ClHelper.create(getClass())
          .addSfRoot("js")
          .addSfRoot("resources")
          .addFile("index.html")
          .ignorePath("/rest")
          .lastResort("index.html")
          .getHandler();
    }

    public static void main(String[] args) throws Exception {
        new Server().launch();
    }
}
