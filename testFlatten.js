const data = [
  {
    "kelas_terapi": "1",
    "obat":[
      {
        "nama_generik": "a",
        "sediaan":[
          {"kekuatan": "x", "FPK_TP": false},
          {"kekuatan": "y", "FPK_TP": true}
        ]
      },
      {
        "nama_generik": "b",
        "sediaan":[
          {"kekuatan": "z"}
        ]
      }
    ]
  }
];

function flattenData(data) {
    if (!Array.isArray(data)) return [data];
    
    let result = [];
    
    for (const item of data) {
        if (typeof item !== 'object' || item === null) {
            result.push({ value: item });
            continue;
        }
        
        let flattenedItem = {};
        let nestedArrays = {};
        
        for (const [key, val] of Object.entries(item)) {
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
                nestedArrays[key] = val;
            } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                for(const [k, v] of Object.entries(val)) {
                    flattenedItem[key + '_' + k] = v;
                }
            } else {
                flattenedItem[key] = val;
            }
        }
        
        const arrayKeys = Object.keys(nestedArrays);
        if (arrayKeys.length === 0) {
            result.push(flattenedItem);
        } else {
            let expanded = [flattenedItem];
            
            for (const key of arrayKeys) {
                let nextExpanded = [];
                for (const row of expanded) {
                    for (const nestedItem of nestedArrays[key]) {
                        const subItems = flattenData([nestedItem]);
                        for (const sub of subItems) {
                            let newRow = { ...row };
                            for (const [subK, subV] of Object.entries(sub)) {
                                newRow[key + '_' + subK] = subV;
                            }
                            nextExpanded.push(newRow);
                        }
                    }
                }
                expanded = nextExpanded;
            }
            result.push(...expanded);
        }
    }
    return result;
}

console.log(JSON.stringify(flattenData(data), null, 2));
