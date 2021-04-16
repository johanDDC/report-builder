import {toCSV} from "./basic-editor";
import {expect} from 'chai';
import 'mocha';

describe('CSV', () => {
  it('escape', () => {
    expect(toCSV([1], [{header: 'H', renderer: t => '' + t}])).eq('H\r\n1\r\n');
    expect(toCSV(['aaa', 'bbb'], [
      {header: 'C1', renderer: t => '1' + t},
      {header: 'C2', renderer: t => '2' + t}
    ])).eq('C1,C2\r\n1aaa,2aaa\r\n1bbb,2bbb\r\n');
  });
  it('spaces', () => {
    expect(toCSV(["aa aa", "bbb b", "ccc  "], [
      {header: "C 1", renderer: t => '' + t},
    ])).eq('C 1\r\naa aa\r\nbbb b\r\nccc  \r\n');
  });
})