import 'mocha';
import {expect} from 'chai';
import * as Code from './code'

describe('Types', () => {
  describe('Code', () => {
    it('Writer', () => {
      const writer = new Code.Writer();
      expect('').to.eq(writer.build())

      writer.indent = 'aa'
      writer.append('bb')
      expect('aabb').to.eq(writer.build())
      writer.append('cc')
      expect('aabbcc').to.eq(writer.build())
      writer.append('\ndd\n')
      expect('aabbcc\naadd\n').to.eq(writer.build())
      writer.indentSpaces(1)
      expect('aabbcc\naadd\n').to.eq(writer.build())
      writer.append('ee')
      expect('aabbcc\naadd\n ee').to.eq(writer.build())
      writer.append('f\nf')
      expect('aabbcc\naadd\n eef\n f').to.eq(writer.build())
    })
    it('Builder', () => {
      const builder = new Code.Builder(2);
      builder
          .appendLine()
          .appendLine('type T = string')
          .appendLine()
          .append('function f(')
      const params = builder.createSub(0);
      builder.appendLine(') {')
      const body = builder.createSub();
      builder.appendLine('}')
      expect(builder.build()).to.eq(
          `
type T = string

function f() {
}
`)
      params.append('a: string')
      body.appendLine('console.log(a)')
      expect(builder.build()).to.eq(
          `
type T = string

function f(a: string) {
  console.log(a)
}
`)
      params.append(', b: number')
      body.appendLine('console.log(b)')
      expect(builder.build()).to.eq(
          `
type T = string

function f(a: string, b: number) {
  console.log(a)
  console.log(b)
}
`)
    })
  })
})