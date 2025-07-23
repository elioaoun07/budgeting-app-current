/* ---- tiny words-to-number helper ---------------------------------- */
function wordsToNumber(str: string) {
  const map: Record<string, number> = {
    zero:0, one:1, two:2, three:3, four:4, five:5,
    six:6, seven:7, eight:8, nine:9, ten:10,
    eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
    sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20,
    thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90
  };
  return str.split(/[\s-]+/).reduce((n,w) => n + (map[w] ?? 0), 0);
}

/* ---- keyword → category/sub rules --------------------------------- */
const keywordMap = [
  { kw:['coffee','starbucks','cafe'],        cat:'Shopping',  sub:'Coffee Shops' },
  { kw:['grocery','supermarket'],            cat:'Shopping',  sub:'Supermarket'  },
  { kw:['fuel','gas','petrol'],              cat:'Car',       sub:'Fuel'         },
  { kw:['rent'],                             cat:'Home',      sub:'Rent'         },
  { kw:['electric','electricity','power'],   cat:'Home',      sub:'Electricity'  },
  { kw:['movie','cinema','netflix'],         cat:'Entertainment', sub:'Movies'   },
  // …extend as needed…
];

/* ---- main export --------------------------------------------------- */
export function localParse(text: string) {
  const lower = text.toLowerCase();

  /* 1) collect every explicit number  ------------------------------- */
  const nums = [...lower.matchAll(/(\d+(\.\d{1,2})?)/g)].map(m => parseFloat(m[1]));

  /* fallback to words-to-number if no digits */
  if (nums.length === 0) {
    const wordMatch = lower.match(
      /(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)([\s-](one|two|three|four|five|six|seven|eight|nine))?/
    );
    if (wordMatch) nums.push(wordsToNumber(wordMatch[0]));
  }

  /* 1-b) interpret multiple amounts  --------------------------------
     pattern: "paid 100 … returned|change 67" → 100 - 67                */
  let amount = 0;
  if (nums.length === 1) {
    amount = nums[0];
  } else if (
    nums.length >= 2 &&
    /(change|returned|refund|cashback|got back)/.test(lower)
  ) {
    amount = Math.max(...nums) - Math.min(...nums);   // 100-67 = 33
  } else {
    amount = nums.reduce((a,b)=>a+b,0);               // fallback: sum
  }

  /* 2) category mapping */
  let category='', subcategory='';
  for (const row of keywordMap) {
    if (row.kw.some(k => lower.includes(k))) {
      category    = row.cat;
      subcategory = row.sub;
      break;
    }
  }

  return amount || category
    ? { amount, category, subcategory, description:text }
    : null;
}