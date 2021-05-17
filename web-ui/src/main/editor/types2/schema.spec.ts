import 'mocha';
import {expect} from "chai";
import * as Schema from "./schema"

class Visitor<T> implements Schema.Visitor<T> {
  public readonly visited: string[] = []

  primitive(field: T, type: string) {
    this.push(field, type, 'primitive');
  }

  array(field: T, type: Schema.Type) {
    this.push(field, type, 'array')
  }

  enum(field: T, options: string[]) {
    this.push(field, options, 'enum')
  }

  object(field: T, type: Schema.ObjectType) {
    this.push(field, type, 'obj')
  }

  check(...expected: string[]) {
    try {
      expected.forEach(exp => {
        expect(this.visited).to.contain(exp)
      })
      expect(this.visited.length).to.eq(expected.length)
    } catch (e) {
      this.visited.forEach(v => {
        console.log(v)
      })
      throw e
    }
  }

  private push(field: T, type: any, kind: string) {
    this.visited.push(`${JSON.stringify(field)} ${kind} ${JSON.stringify(type)}`)
  }
}

describe('Schema', () => {
  const sampleType: Schema.ObjectType = {
    p: 'prim',
    a: {array: true, element: 'element'},
    e: ['1', '2'],
    o: {x: 'aa'}
  };
  it('accept', () => {
    const visitor = new Visitor<string>();
    Schema.accept(sampleType, visitor)
    visitor.check(
        '"p" primitive "prim"',
        '"a" array "element"',
        '"e" enum ["1","2"]',
        '"o" obj {"x":"aa"}'
    )
  })
  it('partialAccept', () => {
    const visitor = new Visitor<string>();
    visitor.object = undefined
    visitor.array = undefined
    Schema.accept(sampleType, visitor)
    visitor.check(
        '"p" primitive "prim"',
        '"e" enum ["1","2"]',
    )
  })
  it('nothingAccept', () => {
    Schema.accept(sampleType, {})
  })

  describe('fieldPath', () => {
    const complexType: Schema.ObjectType = {
      a: "prim1",
      b: {
        c: "prim2",
        d: {array: true, element: {e: "prim3"}},
        f: {g: "prim4"},
        h: ['1', '2']
      }
    };
    it('whole', () => {
      const visitor = new Visitor<string[]>()
      Schema.acceptFieldPaths(complexType, visitor)
      visitor.check(
          '["a"] primitive "prim1"',
          '["b"] obj {"c":"prim2","d":{"array":true,"element":{"e":"prim3"}},"f":{"g":"prim4"},"h":["1","2"]}',
          '["b","c"] primitive "prim2"',
          '["b","d"] array {"e":"prim3"}',
          '["b","f"] obj {"g":"prim4"}',
          '["b","f","g"] primitive "prim4"',
          '["b","h"] enum ["1","2"]'
      )
    })
    it('noObject', () => {
      const visitor = new Visitor<string[]>()
      visitor.object = undefined
      Schema.acceptFieldPaths(complexType, visitor)
      visitor.check(
          '["a"] primitive "prim1"',
          '["b","c"] primitive "prim2"',
          '["b","d"] array {"e":"prim3"}',
          '["b","f","g"] primitive "prim4"',
          '["b","h"] enum ["1","2"]',
      )
    })
  })
})
