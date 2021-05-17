import 'mocha';
import * as Generator from "./tsGenerator";
import * as Code from "./code";

declare function require(name: string): any
// const FS = require('fs')

describe('Definitions', () => {
  it('Sample', () => {
    const schema = {
      collection:	"sys.images.data.TheCollection",
      slices: [
        {
          name:"ARecord",
          query:{_TYPE:"ARecord_Type"},
          "element": {
            "_id": "reference",
            "Country__c": ["US", "FI", "\"Unknown County'"],
            "CreatedDate": "dateTime",
            "IsDeleted": "boolean",
            "Name": "string",
            "Int64": "int64",
            "Decimal": "decimal",
            "DateTime": "dateTime",
            "Date": "date"
          }
        }
      ]
    };
    const settings: Generator.Settings = {
      enum: Generator.defaultEnumFieldGenerator,
      primitives: {
        reference: Generator.DEFAULT_ID_FIELD,
        int64: Generator.DEFAULT_NUMBER_FIELD,
        decimal: Generator.DEFAULT_DECIMAL_FIELD,
        dateTime: Generator.createDefaultDateField("DATE_TIME"),
        date: Generator.createDefaultDateField("DATE"),
      }
    }
    const code = new Code.Builder(2);
    const nsSF = code.appendBlock('namespace _sf {', '}');
    nsSF.appendLine(`export const SF_IMAGE = '${schema.collection}'`)
    Generator.generateTypes(nsSF, schema.slices, settings)

    const constSF = code.appendBlock('const SF = {', '}')
    Generator.generateBuilderConstants(constSF, '_sf', '_sf.SF_IMAGE', schema.slices)

    console.log(code.build())
    // const files = FS.readdirSync('.');
    // console.log(files)
  })
})