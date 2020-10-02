const { overlap, mathMax, mathMin } = require('./tc');

beforeEach(() => {});

test('mathMin/mathMax work', () => {
    expect(mathMax(1,2,3)).toBe(3);
    expect(mathMax(-1,2,-3)).toBe(2);
    expect(mathMin(1,2,3)).toBe(1);
    expect(mathMin(1,-2,-3)).toBe(-3);
});

test('overlap utility works', () => {
    expect(
        overlap(  // 123456789
            3,9,  //   ▓▓▓░░░░
            3,5   //   ▓▓▓
        )
    ).toBe(3);

    expect(
        overlap(   // 123456789
            3,9,   //   ▓▓▓░░░░
            1,5    // ░░▓▓▓
        )
    ).toBe(3);

    expect(
        overlap(   // 123456789
            1,5,   // ░░░▓▓
            4,9    //    ▓▓░░░░
        )
    ).toBe(2);

    expect(
        overlap(   // 123456789
            1,9,   // ░░░▓▓░░░░
            4,5    //    ▓▓
        )
    ).toBe(2);

    expect(
        overlap(   // 123456789
            7,8,   //       ▓▓
            1,8    // ░░░░░░▓▓
        )
    ).toBe(2);

    expect(
        overlap(   // 123456789
            6,9,   //      ░░░░
            1,4    // ░░░░
        )
    ).toBe(0);

    expect(typeof(overlap(1n, 9n, 2n, 3n))).toBe('number');
});
