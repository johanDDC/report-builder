package com.almworks.dyoma.crm.jsreports;

import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.jersey.server.ResourceConfig;
import org.jetbrains.annotations.NotNull;

public class Server extends BaseServerMain {
    @Override
    protected void registerComponents(ResourceConfig rc) {
        rc.registerClasses(HelloWorldServerComponent.class);
    }

    @Override
    protected @NotNull HttpHandler createStaticHandler() {
        return StaticHandler.ClHelper.create(BaseServerMain.class)
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
