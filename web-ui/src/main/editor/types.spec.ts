import {inorderWalk, SchemeCollection} from "./queryTypes";
import {expect} from 'chai';
import 'mocha';

// @ts-ignore
const Scheme2: SchemeCollection = {
    arr: false,
    type: {
        duration: {type: {mins: {type: "int"}, seasons: {type: "int"}}},
        info: {type: {ses: {arr: true, type: "string"}, dur: {arr: true, type: "int"}}},
        arr: {arr: true, type: {b: {type: "int"}}},
        lol: {type: {ses: {type: {a: {type: "int"}, b: {type: "string"}}}}},
        a: {arr: true, type: {b: {type: "int"}, c: {type: "string"}}}
    }
}

// @ts-ignore
const lolScheme: SchemeCollection = {
    type: {
        lol: {
            type: {
                a: {
                    type: {
                        b: {
                            type: {
                                b1: {type: "int"},
                            }
                        },
                        c: {
                            type: {
                                b2: {type: "string"}
                            }
                        }
                    }
                }
            }
        }
    }
}

// @ts-ignore
let realScheme: SchemeCollection = {
    type: {
        "_id": {type: "string"},
        "show_id": {type: "string"},
        "director": {type: "string"},
        "cast": {arr: true, type: "string"},
        "release_date": {type: {"date": {type: "string"}}},
        "description": {type: "string"},
    }
}

describe("types", () => {
    it("primitives", () => {
        let types = [];
        inorderWalk("int", "int", false, types);
        inorderWalk("string", "string", false, types);
        inorderWalk("double", "double", false, types);
        inorderWalk("long", "long", false, types);
        inorderWalk("bool", "bool", false, types);
        expect(types.toString()).eq([
                "\"int\": QPrimitiveField<number>",
                "\"string\": QPrimitiveField<string>",
                "\"double\": QPrimitiveField<number>",
                "\"long\": QPrimitiveField<number>",
                "\"bool\": QPrimitiveField<boolean>",
            ].toString());
    });
    it('arrays', function () {
        let types = [];
        inorderWalk({
            intArr: {arr: true, type: "int"},
            stringArr: {arr: true, type: "string"},
        }, "arrays", true, types);
        expect(types.toString()).eq([
            "\"arrays.intArr\": QPrimitiveField<number[]>",
            "\"arrays.stringArr\": QPrimitiveField<string[]>",
            "\"arrays\": {intArr: QPrimitiveField<number[]>,stringArr: QPrimitiveField<string[]>}[]",
        ].toString());
    });
    it('complex object types', function () {
        let types = [];
        inorderWalk(lolScheme.type["lol"].type, "lol", false, types);
        expect(types.toString()).eq([
            "\"lol.a.b.b1\": QPrimitiveField<number>",
            "\"lol.a.b\": {b1: QPrimitiveField<number>}",
            "\"lol.a.c.b2\": QPrimitiveField<string>",
            "\"lol.a.c\": {b2: QPrimitiveField<string>}",
            "\"lol.a\": {b: {b1: QPrimitiveField<number>},c: {b2: QPrimitiveField<string>}}",
            "\"lol\": {a: {b: {b1: QPrimitiveField<number>},c: {b2: QPrimitiveField<string>}}}",
        ].toString());
        types = [];
        inorderWalk(Scheme2.type["a"].type, "a", true, types);
        expect(types.toString()).eq([
            "\"a.b\": QPrimitiveField<number>",
            "\"a.c\": QPrimitiveField<string>",
            "\"a\": {b: QPrimitiveField<number>,c: QPrimitiveField<string>}[]",
        ].toString());
    });
    it('multidimensional arrays', function () {
        expect.fail();
        // TODO TBA
    });
    it('different mongo types', function () {
        expect.fail();
        // TODO TBA
    });
});