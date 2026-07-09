#!/usr/bin/env python3
"""Batch 4: fills the last 5 uncovered outline nodes for full 126/126 coverage."""
import json, os, random
random.seed(11)
HERE=os.path.dirname(__file__); TODAY="2026-07-08"
FED="Federal Laws"; STATE="Uniform State"; GEN="General Mortgage Knowledge"
ORIG="Origination Activities"; ETH="Ethics"
B=[]
def add(a,r,s,d,t,stem,o,ci,e,c): B.append({"content_area":a,"outline_ref":r,"subtopic":s,"difficulty":d,"type":t,"stem":stem,"options":o,"correct_index":ci,"explanation":e,"primary_source_citation":c,"last_reviewed_date":TODAY})
def money(n): return "${:,.0f}".format(n)
def money2(n): return "${:,.2f}".format(n)
def mc(correct,ds,fmt):
    opts=[correct]+ds; random.shuffle(opts); return [fmt(o) for o in opts], opts.index(correct)

# 2.4.1 examination authority
add(STATE,"2.4.1","Compliance - examination authority","medium","application-scenario",
  "During a routine examination, a state regulator asks to review a licensee's loan files and interview staff. The licensee must:",
  ["Refuse until subpoenaed","Cooperate and provide access to books, records, and personnel as the law requires","Charge the regulator a fee","Provide only marketing materials"],1,
  "State mortgage regulators have statutory authority to examine a licensee's books and records and to interview employees to verify compliance. Licensees are required to cooperate; obstructing an examination is itself a violation.",
  "12 U.S.C. \u00a75111; State Model Law examination authority")
# 2.4.4 assumable loans
add(STATE,"2.4.4","Compliance - assumable loans","medium","application-scenario",
  "A buyer wants to assume the seller's existing FHA loan. Compliant handling requires:",
  ["Letting anyone assume with no review","Processing the assumption per the loan's terms and the servicer's approval, including buyer qualification where required","Ignoring the lender","Converting it to a new loan secretly"],1,
  "Assumable loans (common with FHA/VA) may be taken over by a buyer, but the assumption must follow the note's terms and the servicer's process, which typically includes qualifying the assuming buyer. It cannot be done outside the lender's approval.",
  "State Model Law; FHA/VA assumption requirements")
# 2.4.7 general origination scenario
add(STATE,"2.4.7","Compliance - origination scenario","medium","application-scenario",
  "An MLO realizes after submission that a borrower's income was entered incorrectly. The compliant action is to:",
  ["Leave it to avoid delays","Promptly correct the record and notify the underwriter of the accurate information","Ask the borrower to match the wrong figure","Withdraw the application without explanation"],1,
  "Accuracy is a core compliance duty. On discovering an error, the MLO must promptly correct the file and convey the accurate information to the underwriter. Leaving a known error or coaching the borrower to conform to it would be a violation.",
  "State Model Law required conduct; accurate disclosure duty")

# 4.4.2 monthly payment (full P&I)
def pmt(P, annual, n):
    r=annual/12.0
    return P*r*(1+r)**n/((1+r)**n-1)
for _ in range(3):
    P=random.choice([200000,240000,300000,320000,360000]); rate=random.choice([0.05,0.06,0.065,0.07]); yrs=random.choice([30,15])
    n=yrs*12; correct=round(pmt(P,rate,n),2)
    io=round(P*rate/12,2)  # interest-only distractor
    ds=[io, round(correct*1.12,2), round(correct*0.9,2)]
    opts,ci=mc(correct,ds,money2)
    add(ORIG,"4.4.2","Calculations - monthly payment","hard","calculation",
      f"What is the monthly principal-and-interest payment on a {money(P)} loan at {rate*100:.2f}% for {yrs} years?",
      opts, ci,
      f"Using M = P\u00b7r\u00b7(1+r)^n / ((1+r)^n \u2212 1) with r = {rate:.4f}/12 and n = {n}: the payment is {money2(correct)}. The interest-only figure ({money2(io)}) omits principal and is a common distractor.",
      "Standard amortization formula")

# 4.4.5 ARM adjustment - new rate AND new payment on remaining balance/term
for _ in range(3):
    bal=random.choice([180000,220000,260000,300000]); index=random.choice([3.5,4.0,4.5]); margin=random.choice([2.25,2.5,2.75])
    start=random.choice([4.5,5.0]); per_cap=2.0
    fully=index+margin; new_rate=min(fully, start+per_cap)
    rem_yrs=25; n=rem_yrs*12; correct=round(pmt(bal,new_rate/100,n),2)
    ds=[round(pmt(bal,fully/100,n),2), round(pmt(bal,start/100,n),2), round(bal*new_rate/100/12,2)]
    ds=[d for d in ds if abs(d-correct)>0.01][:3]
    while len(ds)<3: ds.append(round(correct*random.choice([1.08,0.92]),2))
    opts,ci=mc(correct,ds,money2)
    add(ORIG,"4.4.5","Calculations - ARM adjustment payment","hard","calculation",
      f"An ARM adjusts with index {index:.2f}%, margin {margin:.2f}%, and a periodic cap of {per_cap:.0f}% over the prior {start:.2f}% rate. On a {money(bal)} balance with {rem_yrs} years remaining, what is the new monthly P&I?",
      opts, ci,
      f"Fully indexed = index + margin = {fully:.2f}%, but the periodic cap limits the rate to {start:.2f}% + {per_cap:.0f}% = {start+per_cap:.2f}%; the new rate is the lower, {new_rate:.2f}%. Amortizing {money(bal)} at {new_rate:.2f}% over {rem_yrs} years gives {money2(correct)}.",
      "ARM disclosures 12 CFR \u00a71026.20(c); amortization formula")

data=json.load(open(os.path.join(HERE,"questions.json")))
order={FED:1,STATE:2,GEN:3,ORIG:4,ETH:5}
allq=data["questions"]+B
allq.sort(key=lambda x:(order[x["content_area"]],x["outline_ref"]))
for i,q_ in enumerate(allq,1): q_["id"]=f"Q{i:04d}"
data["questions"]=allq; data["meta"]["total"]=len(allq); data["meta"]["version"]="1.1"
json.dump(data,open(os.path.join(HERE,"questions.json"),"w"),indent=2,ensure_ascii=False)
print(f"Batch 4 added {len(B)}. New total: {len(allq)}")
