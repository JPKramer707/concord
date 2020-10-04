const {
    overlap,
    mathMax,
    mathMin,
    rebounce,
    hrtimeToBigint,
} = require('./tc');

beforeEach(() => {});

test('hrtimeToBigint()', () => {
    expect(hrtimeToBigint([1044677, 31388044])).toBe(1044677031388044n);
});

test('rebounce', () => {
    jest.useFakeTimers();
    const counters = { x: 0, y: 0, z: 0 };
    const increment = rebounce(0, 1000, (which) => counters[which]++);

    increment('x');
    increment('x');
    jest.advanceTimersByTime(600);
    expect(counters.x).toBe(0);

    increment('y');
    increment('y');
    jest.advanceTimersByTime(600);
    expect(counters.x).toBe(1);
    expect(counters.y).toBe(0);

    increment('z');
    increment('z');
    jest.advanceTimersByTime(600);
    expect(counters.x).toBe(1);
    expect(counters.y).toBe(1);
    expect(counters.z).toBe(0);

    jest.advanceTimersByTime(600);
    expect(counters.x).toBe(1);
    expect(counters.y).toBe(1);
    expect(counters.z).toBe(1);
});

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
    ).toBe(2);

    expect(
        overlap(   // 123456789
            3,9,   //   ▓▓▓░░░░
            1,5    // ░░▓▓▓
        )
    ).toBe(2);

    expect(
        overlap(   // 123456789
            1,5,   // ░░░▓▓
            4,9    //    ▓▓░░░░
        )
    ).toBe(1);

    expect(
        overlap(   // 123456789
            1,9,   // ░░░▓▓░░░░
            4,5    //    ▓▓
        )
    ).toBe(1);

    expect(
        overlap(   // 123456789
            7,8,   //       ▓▓
            1,8    // ░░░░░░▓▓
        )
    ).toBe(1);

    expect(
        overlap(   // 123456789
            1,8,   // ░░░░░░▓▓
            7,8    //       ▓▓
        )
    ).toBe(1);

    expect(
        overlap(   // 123456789
            6,9,   //      ░░░░
            1,4    // ░░░░
        )
    ).toBe(0);

    expect(
        overlap(   // 123456789
            5,8,   //     ░░░░
            1,4    // ░░░░
        )
    ).toBe(0);

    expect(
        overlap(   // 123456789
            4,8,   //    ▓░░░░
            1,4    // ░░░▓
        )
    ).toBe(0);

    expect(typeof(overlap(1n, 9n, 2n, 3n))).toBe('number');
});
