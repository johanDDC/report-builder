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
        expect(toCSV(["aa,a", "bb, b"], [{header: 'C', renderer: t => '' + t}]))
            .eq('C\r\n"aa,a"\r\n"bb, b"\r\n');
        expect(toCSV(["a\"a\"a", "\"bb, b\""], [{header: 'C', renderer: t => '' + t}]))
            .eq('C\r\n"a\"a\"a"\r\n"\"bb, b\""\r\n');
        expect(toCSV(["a\r\na", "bb\r\n", "\r\ncc"], [{header: 'C', renderer: t => '' + t}]))
            .eq('C\r\n"a\r\na"\r\n"bb\r\n"\r\n"\r\ncc"\r\n');
    });
    it('spaces', () => {
        expect(toCSV(["aa aa", "bbb b", "ccc  ", " aaa"], [
            {header: "C 1", renderer: t => '' + t},
        ])).eq('C 1\r\naa aa\r\nbbb b\r\nccc  \r\n aaa\r\n');
    });
    it('columnsNames',  () => {
        expect(toCSV(["aa aa", "bbb b", "ccc  ", " aaa"], [
            {header: "C 1, or 1 C", renderer: t => '' + t},
            {header: "C 2, or 2\r\nC", renderer: t => '' + t},
        ])).eq('"C 1, or 1 C","C 2, or 2\r\nC"\r\naa aa,aa aa\r\nbbb b,bbb b\r\nccc  ,ccc  \r\n aaa, aaa\r\n');
    });
    it('linuxLineBreaks', () => {
        expect(toCSV(["\naaa\n", "bb\nb"], [{header: 'C', renderer: t => '' + t}]))
            .eq('C\r\n"\naaa\n"\r\n"bb\nb"\r\n');
    });
})