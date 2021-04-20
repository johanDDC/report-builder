import {constuctType} from "./queryTypes";
import {expect} from 'chai';
import 'mocha';

describe("types", () => {
    it("primitives", () => {
        expect(constuctType({
            int: {type: "int"},
            long: {type: "long"},
            double: {type: "double"},
            string: {type: "string"},
            bool: {type: "bool"}
        }, false, "primitives"))
            .eq('{primitives : {int : QPrimitiveField<number>}|{long : QPrimitiveField<number>}|{double : QPrimitiveField<number>}|{string : QPrimitiveField<string>}|{bool : QPrimitiveField<boolean>}}');
    });
    it('arrays', function () {
        expect(constuctType({
            intArr: {arr: true, type: "int"},
            stringArr: {arr: true, type: "string"},
        }, true, "arrays"))
            .eq('{arrays : {intArr : QPrimitiveField<number[]>}|{stringArr : QPrimitiveField<string[]>}[]}');
    });
    it('optional', function () {
        expect(constuctType({
            cocaCola: {optional: true, type: "bool"},
            frenchFrise: {optional: true, type: "bool"},
            sauses: {optional: true, type: "int"},
            clientToken: {type: "string"},
        }, false, "zakaz", true))
            .eq('{zakaz? : {cocaCola? : QPrimitiveField<boolean>}|{frenchFrise? : QPrimitiveField<boolean>}|{sauses? : QPrimitiveField<number>}|{clientToken : QPrimitiveField<string>}}');
    });
    it('complex object types', function () {
        expect(constuctType({
                ses: {arr: true, type: "string"},
                dur: {arr: true, type: "int"}
            },
            false, "info"))
            .eq('{info : {ses : QPrimitiveField<string[]>}|{dur : QPrimitiveField<number[]>}}');
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