import {Collection} from "./typesDefinition"
import {constructEnv} from "./env";
// @ts-ignore
const env = constructEnv("/rest/api/v1/db/testCollection/query/");

Collection.Netflix._id("604fb73b49350172e8292780").$query()