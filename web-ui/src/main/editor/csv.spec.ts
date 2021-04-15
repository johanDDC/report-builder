import {toCSV} from "./basic-editor";
import {expect} from 'chai';
import 'mocha';

describe('CSV', () => {
  it('escape', () => {
    expect(toCSV([1], [{header: 'H', renderer: t => '' + t}])).eq('H\r\n1')
  })
})