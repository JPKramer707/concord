const { Collector } = require('./collector');

class TestCollector extends Collector {
    getValueFromRecord(record) {
        return record.v;
    }

    getIndexFromRecord(record) {
        return record.i;
    }
};

const getDataFromCollection = collection => collection.data.map(item => item.v);

beforeEach(() => {
    collector = new TestCollector({
        onStart: jest.fn(),
        onSustain: jest.fn(),
        onEnd: jest.fn()
    });
});

test('Collector', () => {
    var index = 0;
    collector.addRecord({ v: 10, i: index });
    expect(collector.getCollection().length).toBe(1);

    index++;
    collector.addRecord({ v: 2, i: index });
    expect(collector.getCollection().length).toBe(1);

    index++;
    collector.addRecord({ v: 5, i: index });
    expect(collector.getCollection().length).toBe(1);

    index++;
    collector.addRecord({ v: -1, i: index });
    expect(collector.getCollection().length).toBe(1);

    index++;
    collector.addRecord({ v: 10, i: index });
    expect(collector.getCollection().length).toBe(2);

    index++;
    collector.addRecord({ v: 1, i: index });
    expect(collector.getCollection().length).toBe(2);

    index++;
    collector.addRecord({ v: -1, i: index });
    expect(collector.getCollection().length).toBe(2);

    index++;
    collector.addRecord({ v: 1, i: index });
    expect(collector.getCollection().length).toBe(3);

    const [ one, two, three ] = collector.getCollection();
    expect(JSON.stringify(one.indices)).toBe("[0,2,2]");
    expect(JSON.stringify(getDataFromCollection(one))).toBe("[10,2,5]");
    
    expect(JSON.stringify(two.indices)).toBe("[4,5,5]");
    expect(JSON.stringify(getDataFromCollection(two))).toBe("[null,null,null,null,10,1]");

    expect(JSON.stringify(three.indices)).toBe("[7,7,7]");
    expect(JSON.stringify(getDataFromCollection(three))).toBe("[null,null,null,null,null,null,null,1]");

    const { onStart, onSustain, onEnd } = collector.options;
    expect(onStart.mock.calls.length).toBe(3);
    expect(onSustain.mock.calls.length).toBe(3);
    expect(onEnd.mock.calls.length).toBe(2);
});
