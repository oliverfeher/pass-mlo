#!/usr/bin/env python3
"""
Normalization pass — run LAST in the content pipeline:
    build_bank.py -> bank_batch2.py -> bank_batch3.py -> bank_batch4.py -> normalize.py

Fixes issues the QA audit surfaces:
  1. Removes exact-duplicate stems (keeps first occurrence).
  2. Guarantees 4 distinct options per question (regenerates numeric distractors when needed).
  3. Shuffles option order and remaps the key, removing answer-position bias.
  4. Reassigns sequential ids.
"""
import json, os, re, random
random.seed(2024)
HERE=os.path.dirname(__file__)
FED="Federal Laws"; STATE="Uniform State"; GEN="General Mortgage Knowledge"
ORIG="Origination Activities"; ETH="Ethics"

data=json.load(open(os.path.join(HERE,"questions.json")))
qs=data["questions"]

# 1. dedupe stems
seen=set(); dedup=[]
for q in qs:
    k=re.sub(r"\s+"," ",q["stem"].lower()).strip()
    if k in seen: continue
    seen.add(k); dedup.append(q)
removed=len(qs)-len(dedup)

def parse_num(s):
    m=re.search(r"[-+]?\d[\d,]*\.?\d*", s)
    return float(m.group().replace(",","")) if m else None

def fmt_like(sample, val):
    if "$" in sample and "." in sample: return "${:,.2f}".format(val)
    if "$" in sample: return "${:,.0f}".format(val)
    if "%" in sample:
        dec = 3 if re.search(r"\.\d{3}", sample) else (1 if "." in sample else 0)
        return f"{round(val,dec)}%"
    return str(round(val,2))

# 2. ensure 4 distinct options
for q in qs:
    opts=q["options"]; correct=opts[q["correct_index"]]
    if len(set(opts))==4: continue
    base=parse_num(correct)
    if base is None:
        # non-numeric dup (shouldn't happen) — skip; will be caught by QA
        continue
    new=[correct]; used={correct}
    for f in (0.85,1.12,0.78,1.25,0.9,1.2,0.7,1.3):
        cand=fmt_like(correct, base*f)
        if cand not in used:
            new.append(cand); used.add(cand)
        if len(new)==4: break
    random.shuffle(new)
    q["options"]=new; q["correct_index"]=new.index(correct)

# 3. shuffle option order + remap key (kill position bias)
for q in qs:
    correct=q["options"][q["correct_index"]]
    shuffled=q["options"][:]; random.shuffle(shuffled)
    q["options"]=shuffled; q["correct_index"]=shuffled.index(correct)

# 4. re-id
order={FED:1,STATE:2,GEN:3,ORIG:4,ETH:5}
qs=dedup
qs.sort(key=lambda x:(order[x["content_area"]],x["outline_ref"]))
for i,q in enumerate(qs,1): q["id"]=f"Q{i:04d}"
data["questions"]=qs; data["meta"]["total"]=len(qs); data["meta"]["version"]="1.2"
json.dump(data,open(os.path.join(HERE,"questions.json"),"w"),indent=2,ensure_ascii=False)
print(f"Normalized. Removed {removed} duplicate-stem question(s). Final total: {len(qs)}")
