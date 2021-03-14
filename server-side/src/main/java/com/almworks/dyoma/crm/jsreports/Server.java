package com.almworks.dyoma.crm.jsreports;

import com.almworks.dyoma.crm.jsreports.server.DummyServerController;
import com.almworks.dyoma.crm.jsreports.server.RestServerController;
import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.jersey.server.ResourceConfig;
import org.jetbrains.annotations.NotNull;

public class Server extends BaseServerMain {
    @Override
    protected void registerComponents(ResourceConfig rc) {
        rc.registerClasses(HelloWorldServerComponent.class, RestServerController.class);
        DummyServerController controller = new DummyServerController(() -> getController().shutdown(0));
        rc.register(controller, DummyServerController.class);
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
