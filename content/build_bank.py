#!/usr/bin/env python3
"""
Builds content/questions.json from:
  (1) a curated concept bank authored here (primary-source grounded, outline-tagged), and
  (2) parametric generators for calculation nodes (guaranteed-correct math).

Every item carries an outline_ref into content/outline.json. Re-run any time:
    python3 content/build_bank.py
Then re-check coverage: npm run coverage

FIRST DRAFT. Requires SME accuracy review + legal review before commercial use.
"""
import json, random, os

random.seed(42)
HERE = os.path.dirname(__file__)
TODAY = "2026-07-08"

FED = "Federal Laws"; STATE = "Uniform State"; GEN = "General Mortgage Knowledge"
ORIG = "Origination Activities"; ETH = "Ethics"

# Each concept tuple: (area, outline_ref, subtopic, difficulty, type, stem, options, correct_index, explanation, citation)
C = []
def q(area, ref, sub, diff, typ, stem, opts, ci, exp, cite):
    C.append({"content_area": area, "outline_ref": ref, "subtopic": sub, "difficulty": diff,
              "type": typ, "stem": stem, "options": opts, "correct_index": ci,
              "explanation": exp, "primary_source_citation": cite})

# ==================== FEDERAL LAWS ====================
q(FED,"1.1.1","RESPA purpose","easy","recall",
  "RESPA was enacted primarily to:",
  ["Set maximum interest rates on mortgages","Require disclosure of settlement costs and prohibit abusive practices like kickbacks","Guarantee loan approval for first-time buyers","Establish the federal funds rate"],1,
  "RESPA's core purposes are to give consumers clear disclosure of settlement (closing) costs and to eliminate abusive practices such as kickbacks and referral fees that inflate those costs. It does not cap interest rates, guarantee approval, or set monetary policy.",
  "12 U.S.C. \u00a72601; Regulation X, 12 CFR \u00a71024.1")
q(FED,"1.1.2","RESPA covered loans","medium","application-scenario",
  "Which loan is generally covered by RESPA?",
  ["A loan secured by a 25-acre commercial farm","A federally related mortgage loan on a 1-4 family residential property","A business loan to a corporation","An unsecured personal line of credit"],1,
  "RESPA applies to federally related mortgage loans secured by a first or subordinate lien on 1-4 family residential property. Business-purpose loans, commercial/agricultural loans over the acreage thresholds, and unsecured credit fall outside its scope.",
  "Regulation X, 12 CFR \u00a71024.5")
q(FED,"1.1.4","RESPA settlement services","medium","recall",
  "Under RESPA, a 'settlement service' includes:",
  ["The borrower's monthly grocery budget","Title searches, attorney services, and loan origination","The seller's moving expenses","The real estate agent's car payment"],1,
  "Settlement services are services provided in connection with a real estate settlement, such as title searches and insurance, attorney services, document preparation, appraisals, and loan origination. Unrelated personal expenses are not settlement services.",
  "12 U.S.C. \u00a72602(3); Regulation X, 12 CFR \u00a71024.2")
q(FED,"1.1.7","RESPA escrow statements","medium","recall",
  "RESPA requires a servicer to provide an initial escrow account statement:",
  ["Only if the borrower requests it","At settlement or within 45 days of establishing the escrow account","Every month with the payment coupon","Only when the loan is paid off"],1,
  "The initial escrow account statement must be delivered at settlement or within 45 days of establishing the escrow account. It itemizes estimated taxes, insurance, and other charges to be paid from escrow. Annual statements follow thereafter.",
  "Regulation X, 12 CFR \u00a71024.17(g)")
q(FED,"1.2.2","ECOA prohibited basis","easy","recall",
  "Which is a prohibited basis for discrimination under ECOA?",
  ["Debt-to-income ratio","Credit score","Receipt of public assistance income","Loan-to-value ratio"],2,
  "ECOA prohibits discrimination based on race, color, religion, national origin, sex, marital status, age, or because income comes from public assistance. DTI, credit score, and LTV are legitimate creditworthiness factors a creditor may weigh.",
  "15 U.S.C. \u00a71691(a); Regulation B, 12 CFR \u00a71002.2(z)")
q(FED,"1.2.8","ECOA elderly definition","easy","recall",
  "Under ECOA/Regulation B, an applicant is considered 'elderly' if they are:",
  ["Age 55 or older","Age 62 or older","Age 65 or older","Retired regardless of age"],1,
  "Regulation B defines 'elderly' as age 62 or older. Age generally may not be used against an applicant, though a creditor may consider it favorably (for example, treating an applicant's advanced age as a positive factor) under the empirically derived, demonstrably sound rules.",
  "Regulation B, 12 CFR \u00a71002.2(o)")
q(FED,"1.2.10","ECOA co-signer","medium","application-scenario",
  "An applicant qualifies for a loan on their own. Under ECOA, the creditor:",
  ["May require a spouse to co-sign anyway","May not require a co-signer if the applicant independently qualifies","Must require a co-signer for all married applicants","May require the applicant's parent to co-sign"],1,
  "If an applicant qualifies on their own under the creditor's standards, ECOA prohibits requiring a co-signer, and a creditor may not require that the co-signer be the applicant's spouse if a co-signer is legitimately needed. Requiring a spouse's signature when not necessary is a violation.",
  "Regulation B, 12 CFR \u00a71002.7(d)")
q(FED,"1.2.6","ECOA adverse action content","medium","recall",
  "An ECOA adverse action notice must include:",
  ["The names of other applicants who were approved","The specific reasons for the action or how to request them, and the ECOA notice","The creditor's annual profit","The borrower's full credit report"],1,
  "An adverse action notice must state the specific principal reasons for the action (or disclose the right to request them) and include the ECOA anti-discrimination notice and the credit bureau's contact information when a report was used. It does not disclose other applicants' data or the creditor's financials.",
  "Regulation B, 12 CFR \u00a71002.9(a)(2), (b)")
q(FED,"1.3.1","TILA purpose","easy","recall",
  "The primary purpose of TILA is to:",
  ["Guarantee the lowest interest rate","Promote informed use of credit through disclosure of terms and cost (APR, finance charge)","Insure mortgage loans against default","License loan originators"],1,
  "TILA promotes the informed use of consumer credit by requiring meaningful disclosure of credit terms, most importantly the finance charge and the annual percentage rate (APR), so consumers can compare offers. It does not guarantee rates, insure loans, or handle licensing.",
  "15 U.S.C. \u00a71601; Regulation Z, 12 CFR \u00a71026.1(b)")
q(FED,"1.3.3","TILA APR vs interest rate","medium","application-scenario",
  "How does the APR differ from the note (interest) rate?",
  ["They are always identical","The APR reflects the interest rate plus certain finance charges, so it is usually higher","The note rate includes closing costs; the APR does not","The APR excludes all fees"],1,
  "The note rate is the periodic interest charged on the balance. The APR expresses the cost of credit as a yearly rate that also folds in certain prepaid finance charges (points, some fees), so it is typically higher than the note rate. This lets borrowers compare total credit cost.",
  "Regulation Z, 12 CFR \u00a71026.22; \u00a71026.4")
q(FED,"1.3.5","HOEPA high-cost","medium","application-scenario",
  "A loan is classified as a high-cost mortgage under HOEPA. Which is restricted or prohibited?",
  ["Providing a Loan Estimate","Balloon payments and most prepayment penalties","Verifying the borrower's income","Charging any origination fee"],1,
  "HOEPA adds protections to high-cost mortgages: it restricts balloon payments, prohibits most prepayment penalties, bans loan-flipping and steering, and requires homeownership counseling before the loan. Income verification and disclosures remain required.",
  "15 U.S.C. \u00a71639; Regulation Z, 12 CFR \u00a71026.32, \u00a71026.34")
q(FED,"1.3.6","HPML escrow","medium","recall",
  "For a higher-priced mortgage loan (HPML) secured by a first lien on a principal dwelling, the creditor generally must:",
  ["Waive all closing costs","Establish an escrow account for taxes and insurance for a minimum period","Offer a fixed rate only","Provide a 10-day rescission period"],1,
  "HPML rules generally require the creditor to establish an escrow account for property taxes and insurance for at least the first five years on a first-lien principal-dwelling HPML, with limited exemptions (e.g., certain small creditors). They also trigger additional appraisal requirements.",
  "Regulation Z, 12 CFR \u00a71026.35(b)")
q(FED,"1.3.7","LO compensation","hard","application-scenario",
  "Under the Loan Originator Compensation rule, an MLO's compensation may NOT be based on:",
  ["The number of loans originated","A loan's interest rate or other transaction terms","A fixed percentage of the loan amount, set in advance","An hourly wage"],1,
  "Reg Z prohibits compensating an originator based on the terms of a transaction (such as the interest rate). Compensation may be based on loan amount, a fixed per-loan amount, or hourly/salary, but tying pay to rate or terms incentivizes steering and is barred. Dual compensation (from both consumer and another party) is also prohibited.",
  "Regulation Z, 12 CFR \u00a71026.36(d)")
q(FED,"1.4.1","TRID purpose","easy","recall",
  "The TRID rule integrated disclosures from which two laws?",
  ["ECOA and FCRA","RESPA and TILA","HMDA and HOEPA","GLBA and BSA"],1,
  "TRID (TILA-RESPA Integrated Disclosure) combined the former GFE and initial TIL into the Loan Estimate, and the HUD-1 and final TIL into the Closing Disclosure, integrating RESPA and TILA disclosure requirements into two consumer forms.",
  "Regulation Z, 12 CFR \u00a71026.19(e),(f)")
q(FED,"1.4.4","Consummation","medium","recall",
  "For TRID purposes, 'consummation' occurs when:",
  ["The borrower's offer is accepted by the seller","The consumer becomes contractually obligated on the loan","The appraisal is completed","The Loan Estimate is delivered"],1,
  "Consummation is the time a consumer becomes contractually obligated on the credit transaction (determined by state law), which is not necessarily the same day as closing/settlement. The Closing Disclosure must be received at least three business days before consummation.",
  "Regulation Z, 12 CFR \u00a71026.2(a)(13)")
q(FED,"1.4.5","Special information booklet","medium","recall",
  "The special information booklet (home-buying/settlement-cost booklet) must generally be provided:",
  ["Never; it was eliminated","Within three business days of receiving an application for a purchase loan","Only at closing","Only for refinances"],1,
  "For most purchase-money transactions, the creditor must deliver the special information booklet within three business days of receiving the application. It is generally not required for refinances or certain other transactions.",
  "Regulation Z, 12 CFR \u00a71026.19(g)")
q(FED,"1.4.9","Change of circumstances","hard","application-scenario",
  "A valid 'changed circumstance' under TRID permits the creditor to:",
  ["Ignore tolerance limits entirely","Issue a revised Loan Estimate resetting certain fee tolerances","Cancel the loan without notice","Increase the interest rate at will"],1,
  "A changed circumstance (e.g., new information, a consumer-requested change, or an event beyond control affecting eligibility) allows a revised Loan Estimate that may reset the good-faith tolerance baselines for affected charges, generally within three business days of learning of the change. It is not a license to exceed tolerances arbitrarily.",
  "Regulation Z, 12 CFR \u00a71026.19(e)(3)(iv)")
q(FED,"1.4.12","Annual escrow statement","easy","recall",
  "The annual escrow account statement provided to a borrower shows:",
  ["The borrower's credit score history","Account activity and projected escrow payments for the coming year","The lender's internal profit margin","Comparable home sales"],1,
  "The annual escrow statement summarizes the prior year's escrow activity and projects the coming year's escrow payments and any surplus or shortage. It helps the borrower understand payment changes driven by taxes and insurance.",
  "Regulation X, 12 CFR \u00a71024.17(i)")
q(FED,"1.5.1","HMDA purpose","medium","recall",
  "The Home Mortgage Disclosure Act (HMDA) primarily requires lenders to:",
  ["Cap points and fees","Report application and loan data used to detect discriminatory lending patterns","Provide a three-day rescission","Set escrow accounts"],1,
  "HMDA is a fair-lending law requiring covered lenders to collect and report data on applications and originations so regulators and the public can identify discriminatory patterns such as redlining and assess community credit needs.",
  "12 U.S.C. \u00a72801; Regulation C, 12 CFR Part 1003")
q(FED,"1.5.2","FCRA adverse action","medium","application-scenario",
  "When a credit report contributes to a loan denial, the FCRA requires the creditor to:",
  ["Delete the credit report","Provide the consumer notice including the credit bureau's name and the right to a free report","Increase the interest rate","Report the denial to the IRS"],1,
  "Under the FCRA, if information in a consumer report is a basis for adverse action, the consumer must receive notice identifying the credit reporting agency and stating the right to obtain a free copy of the report and to dispute its accuracy.",
  "15 U.S.C. \u00a71681m")
q(FED,"1.5.3","Red Flags Rule","medium","recall",
  "The FTC Red Flags Rule requires covered financial institutions to:",
  ["Flag loans with high interest rates","Maintain a written Identity Theft Prevention Program","Report all loans over $10,000","Provide free credit monitoring to all customers"],1,
  "The Red Flags Rule requires covered institutions and creditors to develop and implement a written Identity Theft Prevention Program to detect, prevent, and mitigate identity theft in connection with covered accounts.",
  "16 CFR \u00a7681.1 (FACTA Red Flags Rule)")
q(FED,"1.5.4","BSA/AML SAR","medium","application-scenario",
  "Under BSA/AML rules, a covered mortgage lender that detects suspected mortgage fraud must:",
  ["Tell the borrower it filed a report","File a Suspicious Activity Report (SAR) and not disclose it to the subject","Immediately deny all pending loans","Contact the local police only"],1,
  "Covered institutions must file a SAR for suspicious transactions and are prohibited from disclosing (tipping off) the subject that a SAR was filed. This supports FinCEN's anti-money-laundering enforcement.",
  "31 U.S.C. \u00a75318(g); 31 CFR Part 1029")
q(FED,"1.5.5","GLBA privacy","medium","recall",
  "The Gramm-Leach-Bliley Act (GLBA) requires financial institutions to:",
  ["Publish borrowers' loan terms publicly","Provide privacy notices and safeguard nonpublic personal information","Offer identical rates to all applicants","File HMDA data"],1,
  "GLBA requires financial institutions to give consumers privacy notices explaining information-sharing practices, honor opt-out rights where applicable, and maintain safeguards to protect nonpublic personal information (the Safeguards Rule).",
  "15 U.S.C. \u00a76801-6809; Regulation P, 12 CFR Part 1016")
q(FED,"1.5.6","MAP/Reg N advertising","medium","application-scenario",
  "Under the Mortgage Acts and Practices (Regulation N) advertising rule, an MLO advertisement:",
  ["May guarantee approval for everyone","May not make material misrepresentations about loan terms","Must include the borrower's credit score","May omit the APR entirely with no consequence"],1,
  "Regulation N (the MAP Rule) prohibits material misrepresentations in mortgage advertising, including about rates, fees, the existence of the offer, and government affiliation. Guaranteeing universal approval is a classic prohibited misrepresentation.",
  "Regulation N, 12 CFR Part 1014")
q(FED,"1.5.7","E-Sign Act","easy","recall",
  "The E-Sign Act allows electronic disclosures and signatures if:",
  ["The consumer never has to consent","The consumer affirmatively consents and can access the electronic records","Only the lender agrees","The loan is over $50,000"],1,
  "The E-Sign Act gives electronic records and signatures the same legal effect as paper, provided the consumer affirmatively consents and demonstrates the ability to access the records in the format used, after receiving specific disclosures about the arrangement.",
  "15 U.S.C. \u00a77001")
q(FED,"1.5.9","HPA/PMI cancellation","medium","application-scenario",
  "Under the Homeowners Protection Act, borrower-requested cancellation of PMI is generally available when the loan balance reaches:",
  ["50% of the original value","80% of the original property value (with a good payment history)","95% of the original value","The loan is paid in full"],1,
  "The HPA lets a borrower request PMI cancellation when the principal balance reaches 80% of the original value (with a good payment history and other conditions), and requires automatic termination at 78%. This prevents PMI from continuing indefinitely.",
  "12 U.S.C. \u00a74902")
q(FED,"1.5.10","Dodd-Frank/CFPB","easy","recall",
  "The Dodd-Frank Act created which agency now responsible for most federal consumer mortgage rules?",
  ["The FDIC","The Consumer Financial Protection Bureau (CFPB)","The SEC","The Federal Reserve Board only"],1,
  "Dodd-Frank established the CFPB and transferred rulemaking and enforcement authority for many consumer financial laws (RESPA, TILA, ECOA, HMDA, and others) to it. It also created the ATR/QM framework and the LO compensation rules.",
  "Dodd-Frank Act, Pub. L. 111-203; 12 U.S.C. \u00a75481 et seq.")
q(FED,"1.6.1","CFPB authority","easy","recall",
  "The CFPB's authority includes:",
  ["Setting the federal funds rate","Writing and enforcing rules under federal consumer financial laws","Approving individual loan applications","Issuing real estate licenses"],1,
  "The CFPB writes implementing regulations for federal consumer financial laws and supervises and enforces compliance. It does not set monetary policy, approve individual loans, or license real estate agents.",
  "12 U.S.C. \u00a75491, \u00a75512")
q(FED,"1.2.1","ECOA permissible inquiry","medium","application-scenario",
  "Under ECOA, a creditor MAY ask about an applicant's:",
  ["Religion","Intent to have children","Obligation to pay alimony or child support that the applicant relies on for repayment","National origin, to deny the loan"],2,
  "A creditor may ask about alimony/child support if the applicant chooses to rely on it for qualifying, and must consider it. Inquiries into religion, childbearing intentions, or using national origin to deny are prohibited.",
  "Regulation B, 12 CFR \u00a71002.5")

# ==================== UNIFORM STATE ====================
q(STATE,"2.1.1","SAFE Act purpose","easy","recall",
  "A primary purpose of the SAFE Act is to:",
  ["Set national interest-rate caps","Increase uniformity and consumer protection by requiring MLO licensing/registration through NMLS","Eliminate state mortgage regulators","Guarantee mortgage approvals"],1,
  "The SAFE Act aims to enhance consumer protection and reduce fraud by setting minimum standards for licensing and registration of mortgage loan originators and requiring participation in the NMLS. States may impose stricter standards.",
  "12 U.S.C. \u00a75101")
q(STATE,"2.2.4","Unique identifier","easy","recall",
  "The NMLS unique identifier assigned to an MLO:",
  ["Changes with each employer","Stays with the individual permanently and must appear on loan documents","Is the same as the SSN","Is confidential to regulators"],1,
  "The unique identifier follows the individual across employers and states for life and must be provided on residential mortgage loan documents and advertisements so consumers can verify the originator through NMLS Consumer Access. It is not the SSN.",
  "12 U.S.C. \u00a75103; 12 CFR \u00a71008.107")
q(STATE,"2.3.1","Who must be licensed","medium","application-scenario",
  "Which individual must hold a state MLO license?",
  ["A loan processor performing only clerical tasks under supervision","A person who takes residential mortgage applications and offers or negotiates loan terms for compensation","An employee of a national bank who is a registered MLO","A real estate appraiser"],1,
  "A state MLO license is required for someone who both takes residential mortgage loan applications and offers or negotiates terms for compensation or gain. Purely clerical processors, registered (depository) MLOs, and appraisers are treated differently.",
  "12 U.S.C. \u00a75102(4); 12 CFR \u00a71008.103")
q(STATE,"2.3.3","Processor activities","medium","application-scenario",
  "A loan processor who works under the supervision of a licensed MLO and performs only clerical support:",
  ["Must be individually licensed as an MLO","Generally does not need an MLO license for clerical/administrative tasks","May negotiate rates with borrowers","Must hold a real estate license"],1,
  "Clerical or support duties (assembling documents, requesting information) performed under a licensed/registered MLO's supervision generally do not require an MLO license. The line is crossed if the processor offers or negotiates terms or advises on loan terms.",
  "12 CFR \u00a71008.103(c)")
q(STATE,"2.3.6","PE requirement","easy","recall",
  "Before licensure, an MLO must complete at least how many hours of NMLS-approved pre-licensing education?",
  ["8 hours","12 hours","20 hours","40 hours"],2,
  "The SAFE Act requires a minimum of 20 hours of NMLS-approved pre-licensing education, including specific hours of federal law, ethics, and nontraditional mortgage lending. States may require additional hours.",
  "12 U.S.C. \u00a75104(c); 12 CFR \u00a71008.105(b)")
q(STATE,"2.3.6","Test passing","medium","recall",
  "To satisfy the SAFE Act testing requirement, an applicant must pass the national test with a score of at least:",
  ["60%","70%","75%","90%"],2,
  "A passing score on the SAFE MLO test is 75%. The national component with Uniform State Content satisfies both national and state knowledge requirements in participating states.",
  "12 U.S.C. \u00a75105; SAFE MLO Test Content Outline")
q(STATE,"2.3.11","CE requirement","easy","recall",
  "To renew a license, an MLO must complete at least how many hours of continuing education annually?",
  ["4 hours","8 hours","16 hours","20 hours"],1,
  "The SAFE Act requires at least 8 hours of NMLS-approved continuing education each year, covering federal law, ethics, and nontraditional mortgage lending. CE must be completed before renewal.",
  "12 U.S.C. \u00a75105(b); 12 CFR \u00a71008.107(b)")
q(STATE,"2.3.11","Renewal window","medium","recall",
  "The standard NMLS license renewal window runs:",
  ["January 1 - March 31","July 1 - September 30","November 1 - December 31","Anytime during the year"],2,
  "The annual NMLS renewal period runs November 1 through December 31. The MLO must have completed that year's CE and meet all standards to renew; failing to renew moves the license to a non-renewed status.",
  "NMLS Annual Renewal policy; 12 CFR \u00a71008.107")
q(STATE,"2.3.6","Financial responsibility","medium","recall",
  "As part of demonstrating financial responsibility, a licensed MLO must generally:",
  ["Hold a college degree","Be covered by a surety bond or meet a net-worth/recovery-fund alternative","Deposit $100,000 with the state","Own real estate"],1,
  "Financial responsibility standards require coverage by a surety bond (amount often tied to loan volume) or, where applicable, a net-worth requirement or payment into a state recovery fund. A background and credit check also inform the fitness determination.",
  "12 U.S.C. \u00a75104; 12 CFR \u00a71008.105(d)")
q(STATE,"2.3.6","Felony bar","medium","application-scenario",
  "Under the SAFE Act, a felony conviction affects licensing how?",
  ["No effect","A felony within 7 years bars licensing; a felony involving fraud/dishonesty/breach of trust/money laundering bars it permanently","Only misdemeanors matter","Bars licensing for 30 days"],1,
  "A felony conviction in the seven years before application bars licensure, and a felony at any time involving fraud, dishonesty, breach of trust, or money laundering is a permanent bar. Fingerprint-based background checks enforce these standards.",
  "12 U.S.C. \u00a75104(b)(2)")
q(STATE,"2.3.13","Temporary Authority","hard","application-scenario",
  "Temporary Authority to Originate (from the 2018 EGRRCPA) allows certain applicants to:",
  ["Skip the SAFE test forever","Originate loans for a limited period while a complete license application is pending, if eligibility conditions are met","Work without any NMLS record","Ignore CE requirements permanently"],1,
  "Temporary Authority lets a qualifying individual (e.g., a registered MLO moving to a state-licensed company, or a licensee moving states) originate for up to 120 days while a complete application is pending, provided conditions such as a clean history and prior licensure/registration are met.",
  "12 U.S.C. \u00a75117 (EGRRCPA)")
q(STATE,"2.4.2","Prohibited: supervisor ID","medium","application-scenario",
  "An unlicensed assistant uses a licensed MLO's unique identifier to originate a loan. This is:",
  ["Acceptable with supervisor approval","A prohibited act; each originator must use their own credentials","Required by NMLS","Permitted for training only"],1,
  "Using another person's unique identifier or license to originate is a prohibited act. Each MLO must act under their own credentials, and allowing an unlicensed person to originate under a licensee's identifier exposes both to disciplinary action.",
  "State Model Law prohibited acts; 12 U.S.C. \u00a75101 et seq.")
q(STATE,"2.4.8","Advertising identifier","easy","application-scenario",
  "An MLO's advertisement for residential mortgage services must include:",
  ["The borrower's income","The MLO's NMLS unique identifier","A guarantee of approval","The lender's profit margin"],1,
  "Advertisements and loan documents must display the MLO's NMLS unique identifier so consumers can verify the originator. Advertising must also be truthful and non-misleading under applicable federal and state rules.",
  "12 CFR \u00a71008.107; Regulation N, 12 CFR Part 1014")
q(STATE,"2.4.3","Record retention","medium","recall",
  "State mortgage regulators typically require licensees to:",
  ["Destroy loan files after closing","Retain records for a set period and produce them for examination","Share files with competitors","Keep records only if requested by the borrower"],1,
  "Licensees must retain loan and business records for a period set by state law and make them available to the regulator for examination. Record retention supports supervision and enforcement of the mortgage laws.",
  "State Model Law recordkeeping provisions")
q(STATE,"2.2.3","Exam authority","medium","recall",
  "A state mortgage regulator's examination authority allows it to:",
  ["Set the borrower's interest rate","Examine a licensee's books and records and interview employees","Approve individual loan applications","Waive federal law"],1,
  "State regulators may conduct examinations, review books and records, and interview employees to assess compliance. Their authority is defined and limited by the delegating statute; they cannot exceed the powers granted by law.",
  "12 U.S.C. \u00a75111; State Model Law")

# ==================== GENERAL MORTGAGE KNOWLEDGE ====================
q(GEN,"3.1.2","Conforming loans","medium","recall",
  "A conforming conventional loan is one that:",
  ["Is insured by FHA","Meets Fannie Mae/Freddie Mac limits and underwriting guidelines","Exceeds the FHFA loan limit","Requires no underwriting"],1,
  "A conforming loan meets the FHFA conforming loan limits and the GSEs' (Fannie Mae/Freddie Mac) underwriting guidelines, making it eligible for purchase on the secondary market. FHA loans are government-insured, and loans above the limit are jumbo.",
  "12 U.S.C. \u00a71717; FHFA conforming limits")
q(GEN,"3.1.3","FHA MI","medium","application-scenario",
  "A defining feature of an FHA loan is:",
  ["No mortgage insurance","An upfront premium plus annual MIP regardless of down payment","A 20% down payment requirement","Eligibility limited to veterans"],1,
  "FHA loans permit low down payments but require mortgage insurance: an upfront premium (UFMIP) plus an annual MIP that on most current terms lasts the life of the loan. VA loans (not FHA) are the veterans' product.",
  "National Housing Act; HUD Handbook 4000.1")
q(GEN,"3.1.3","VA funding fee","medium","recall",
  "In place of monthly mortgage insurance, a VA loan charges:",
  ["Monthly PMI","A one-time VA funding fee","An annual MIP","A discount point"],1,
  "VA loans do not require monthly mortgage insurance; instead they charge a one-time VA funding fee (which can be financed and may be waived for certain disabled veterans). VA loans also allow no-down-payment purchases for eligible borrowers.",
  "38 U.S.C. Chapter 37; VA Pamphlet 26-7")
q(GEN,"3.1.3","USDA loans","medium","recall",
  "USDA Rural Development guaranteed loans are designed for:",
  ["High-rise urban condos","Eligible moderate-income borrowers in designated rural areas, often with no down payment","Commercial farms only","Second homes"],1,
  "USDA guaranteed loans help eligible low-to-moderate-income borrowers purchase primary residences in designated rural areas, frequently with no down payment. Income and property-location eligibility requirements apply.",
  "7 CFR Part 3555 (USDA Rural Development)")
q(GEN,"3.1.4","Subprime/non-QM","medium","recall",
  "A non-qualified mortgage (non-QM) is one that:",
  ["Always has a lower rate than a QM","Does not meet all QM criteria (e.g., uses alternative income docs or has certain features)","Is illegal to originate","Is guaranteed by the government"],1,
  "A non-QM loan does not satisfy all QM requirements. It may use alternative documentation or include features QMs exclude. Non-QM loans are legal but do not receive the QM presumption of ATR compliance, so lenders must still make a reasonable ability-to-repay determination.",
  "Regulation Z, 12 CFR \u00a71026.43")
q(GEN,"3.2.1","Fixed-rate feature","easy","recall",
  "In a fixed-rate mortgage:",
  ["The rate adjusts with an index","The principal-and-interest payment stays constant over the term","There is negative amortization","The rate resets every year"],1,
  "A fixed-rate mortgage keeps the same note rate and the same principal-and-interest payment for the life of the loan, so the payment is predictable (taxes/insurance in escrow may still change). Only ARMs adjust with an index.",
  "Standard product definition; ARM disclosure contrast at 12 CFR \u00a71026.19(b)")
q(GEN,"3.2.3","Second mortgage","medium","recall",
  "A purchase-money second mortgage is:",
  ["A first lien used to refinance","A subordinate lien taken out at purchase, often to reduce the down payment or avoid PMI","A government-insured loan","A reverse mortgage"],1,
  "A purchase-money second mortgage is a subordinate (junior) lien originated at the time of purchase, commonly used in piggyback structures to reduce the required down payment or avoid PMI. It is repaid after the first lien in a foreclosure.",
  "Standard product definition")
q(GEN,"3.2.4","Balloon mortgage","medium","application-scenario",
  "A balloon mortgage is characterized by:",
  ["Fully amortizing payments over 30 years","Smaller periodic payments with a large lump-sum balance due at maturity","No interest","Government insurance"],1,
  "A balloon loan has periodic payments that do not fully amortize the balance, leaving a large lump sum (the balloon) due at maturity. It carries refinancing/payment-shock risk and is generally excluded from standard QM status (with limited exceptions).",
  "Standard product definition; QM exclusion at 12 CFR \u00a71026.43(e)")
q(GEN,"3.2.5","Reverse mortgage","medium","application-scenario",
  "A reverse mortgage (HECM) is designed for:",
  ["First-time buyers with low income","Older homeowners (generally 62+) to convert home equity into funds with no required monthly principal-and-interest payments","Commercial investors","Short-term construction financing"],1,
  "A HECM reverse mortgage lets eligible older homeowners (generally 62+) draw on home equity without required monthly P&I payments; the balance grows over time and is repaid when the borrower dies, sells, or moves. Counseling is required.",
  "HECM program, 24 CFR Part 206")
q(GEN,"3.2.6","HELOC","medium","recall",
  "A home equity line of credit (HELOC) is best described as:",
  ["A closed-end fixed-rate first mortgage","An open-end revolving line secured by the home, usually with a variable rate","A government grant","An unsecured personal loan"],1,
  "A HELOC is open-end (revolving) credit secured by the borrower's home, typically with a variable rate and a draw period followed by a repayment period. As open-end credit secured by a principal dwelling, it carries a right of rescission on applicable transactions.",
  "Regulation Z open-end provisions, 12 CFR \u00a71026.40")
q(GEN,"3.2.7","Construction loan","medium","recall",
  "A construction-to-permanent loan:",
  ["Funds the full amount at closing regardless of progress","Disburses in stages (draws) as construction progresses, then converts to permanent financing","Requires no appraisal","Is always interest-free"],1,
  "A construction loan disburses funds in draws tied to construction milestones and often converts to a permanent mortgage on completion. During construction the borrower typically pays interest only on funds drawn.",
  "Standard product definition")
q(GEN,"3.2.8","Interest-only","medium","application-scenario",
  "During the interest-only period of an interest-only loan:",
  ["The balance decreases each month","No principal is paid, so the balance stays level until amortization begins","The rate cannot change","The loan is a QM"],1,
  "In the interest-only period the borrower pays only interest, so the principal balance does not decline; when the amortization period begins, payments jump (payment shock). Interest-only features disqualify a loan from QM status.",
  "Standard product definition; QM exclusion 12 CFR \u00a71026.43(e)")
q(GEN,"3.3.1","Rate lock","easy","recall",
  "A rate lock is:",
  ["A penalty for early payoff","A commitment guaranteeing a specified interest rate for a set period","A type of mortgage insurance","A second lien"],1,
  "A rate lock guarantees a stated interest rate (and often points) for a defined period, protecting the borrower from rate increases before closing. If the lock expires before closing, terms may change or an extension fee may apply.",
  "Standard industry term")
q(GEN,"3.3.1","Table funding","medium","recall",
  "Table funding refers to:",
  ["Funding a loan from the borrower's escrow","A settlement at which the broker's loan is simultaneously assigned to the lender who supplies the funds","A cash-only closing","A government subsidy"],1,
  "In table funding, the loan closes in the originating broker's name but is simultaneously assigned to the lender that actually advances the funds at the settlement table. RESPA addresses disclosure in such arrangements.",
  "Regulation X, 12 CFR \u00a71024.2 (definition)")
q(GEN,"3.3.2","Servicing transfer","medium","application-scenario",
  "When servicing of a loan is transferred, RESPA requires:",
  ["No notice to the borrower","Notice to the borrower with a 60-day grace period for payments sent to the old servicer","Immediate repayment of the loan","A new appraisal"],1,
  "On a servicing transfer, the borrower must receive notice, and payments mistakenly sent to the prior servicer during a 60-day grace period cannot be treated as late. This protects borrowers during the handoff.",
  "12 U.S.C. \u00a72605; Regulation X, 12 CFR \u00a71024.33")
q(GEN,"3.3.3","Daily simple interest","medium","recall",
  "On a daily simple interest loan, interest is calculated:",
  ["Once per year on the original balance","Each day on the outstanding principal balance","Only at payoff","On the appraised value"],1,
  "Daily simple interest accrues each day on the current outstanding principal, so the timing of payments affects total interest. Paying earlier reduces accrued interest; paying later increases it, unlike a standard monthly-accrual amortization.",
  "Standard finance definition")
q(GEN,"3.3.4","Assumable loans","medium","recall",
  "An assumable mortgage allows:",
  ["The lender to raise the rate at will","A qualified buyer to take over the seller's existing loan and its terms","The seller to keep the loan after selling","Automatic loan forgiveness"],1,
  "An assumable loan lets a qualified buyer assume the seller's existing mortgage, including its rate and terms, often subject to lender approval. Many government loans (FHA/VA) are assumable; most conventional loans contain due-on-sale clauses that prevent assumption.",
  "Standard product definition; due-on-sale at 12 U.S.C. \u00a71701j-3")
q(GEN,"3.3.4","Primary vs secondary market","easy","recall",
  "The secondary mortgage market is where:",
  ["Borrowers apply for loans","Existing loans are bought and sold among investors (e.g., the GSEs)","Homes are appraised","Title insurance is issued"],1,
  "The primary market is where lenders originate loans to borrowers; the secondary market is where those loans are bought, sold, and securitized (e.g., by Fannie Mae and Freddie Mac), providing liquidity so lenders can make new loans.",
  "Standard market-structure definition")

# ==================== ORIGINATION ACTIVITIES ====================
q(ORIG,"4.1.1","Loan inquiry disclosures","medium","application-scenario",
  "A consumer provides the six items that make an application. This triggers the requirement to:",
  ["Immediately fund the loan","Deliver a Loan Estimate within three business days","Order the closing","Waive the appraisal"],1,
  "Receiving the six application items (name, income, SSN, property address, estimated value, loan amount) triggers the three-business-day Loan Estimate requirement. It does not fund the loan or waive underwriting steps.",
  "Regulation Z, 12 CFR \u00a71026.19(e)(1)(iii)")
q(ORIG,"4.1.3","Verification of employment","medium","recall",
  "A verification of employment (VOE) is used to:",
  ["Confirm the borrower's stated employment and income","Order title insurance","Set the interest rate","Waive the down payment"],0,
  "A VOE confirms the borrower's employment status and income with the employer, supporting the income used in qualifying. It is part of documenting the borrower's ability to repay, distinct from title or rate-setting steps.",
  "Standard underwriting practice; ATR income verification 12 CFR \u00a71026.43(c)")
q(ORIG,"4.1.4","Suitability","medium","application-scenario",
  "When recommending a loan program, an MLO should:",
  ["Steer the borrower to the highest-commission product","Match the product to the borrower's needs and qualifications","Always recommend an ARM","Recommend interest-only for all"],1,
  "Products should be matched to the borrower's documented needs and qualifications. Recommending a costlier or riskier product to increase compensation is steering and is prohibited; suitability protects the consumer and the originator.",
  "Regulation Z anti-steering, 12 CFR \u00a71026.36(e)")
q(ORIG,"4.1.5","Zero-tolerance fees","hard","application-scenario",
  "Under TRID good-faith tolerances, which charge generally falls in the 'zero tolerance' category (cannot increase from the Loan Estimate)?",
  ["Recording fees","Lender/broker fees and transfer taxes","Prepaid interest","Homeowner's insurance the borrower shops for"],1,
  "Zero-tolerance charges (which may not increase) include fees paid to the creditor or broker, fees for services the consumer cannot shop for, and transfer taxes. Recording fees and services the borrower can shop for fall under the 10% cumulative tolerance or have no tolerance limit (like prepaid interest and insurance).",
  "Regulation Z, 12 CFR \u00a71026.19(e)(3)(i)")
q(ORIG,"4.1.5","Ten-percent tolerance","hard","recall",
  "Charges subject to the 10% cumulative tolerance under TRID typically include:",
  ["Lender origination fees","Recording fees and charges for third-party services the borrower can shop for (from the creditor's list)","Prepaid interest","Property taxes"],1,
  "The 10% cumulative tolerance covers recording fees and charges for third-party services the consumer is permitted to shop for when the provider is chosen from the creditor's written list. The total of these may not increase by more than 10% in good faith.",
  "Regulation Z, 12 CFR \u00a71026.19(e)(3)(ii)")
q(ORIG,"4.1.6","Notification of action","medium","application-scenario",
  "An application is incomplete. Under ECOA, the creditor should:",
  ["Deny it for incompleteness immediately","Send a notice of incompleteness stating what is needed and a reasonable time to provide it","Do nothing","Close the loan and gather items later"],1,
  "For an incomplete application, Regulation B provides for a notice of incompleteness specifying the required information and a reasonable deadline (within the 30-day framework). Outright denial or inaction is improper.",
  "Regulation B, 12 CFR \u00a71002.9(c)")
q(ORIG,"4.1.7","Revised LE expiration","medium","recall",
  "The interest rate and charges on a Loan Estimate that the consumer has not yet indicated intent to proceed with:",
  ["Are locked for 30 days automatically","May expire after 10 business days if the consumer has not expressed intent to proceed","Can never change","Are guaranteed until closing"],1,
  "A consumer must indicate intent to proceed to lock in the Loan Estimate's terms; the estimated closing costs may expire if the consumer does not express intent within 10 business days. The rate itself is only guaranteed if separately locked.",
  "Regulation Z, 12 CFR \u00a71026.19(e)(3)(iv)(C)")
q(ORIG,"4.1.8","Homeownership counseling","medium","recall",
  "Within three business days of application, a lender must provide a written list of:",
  ["Comparable home sales","Homeownership counseling organizations","Local real estate agents","Title companies only"],1,
  "Lenders must give applicants a written list of homeownership counseling organizations (typically generated from the CFPB or HUD tool) within three business days of application, so borrowers can access counseling resources.",
  "Regulation X, 12 CFR \u00a71024.20")
q(ORIG,"4.2.1","Qualifying ratios","medium","application-scenario",
  "In underwriting, the 'front-end' ratio measures:",
  ["Total debt to income","The housing payment (PITI) as a percentage of gross monthly income","Loan to value","Assets to liabilities"],1,
  "The front-end (housing) ratio is PITI divided by gross monthly income. The back-end ratio adds all other monthly debt obligations. Both help assess the borrower's capacity to repay.",
  "Standard underwriting; ATR DTI 12 CFR \u00a71026.43(c)(7)")
q(ORIG,"4.2.1","Ability to repay","hard","recall",
  "Under the ATR rule, the number of underwriting factors a creditor must consider is:",
  ["Three","Five","Eight","Twelve"],2,
  "The ATR rule requires consideration of eight factors, including income/assets, employment, the mortgage payment, simultaneous-loan payments, mortgage-related obligations, other debts, DTI or residual income, and credit history.",
  "Regulation Z, 12 CFR \u00a71026.43(c)(2)")
q(ORIG,"4.2.2","Appraisal approaches","medium","recall",
  "The three traditional approaches to value in an appraisal are:",
  ["Sales comparison, cost, and income","Retail, wholesale, and auction","Front-end, back-end, and combined","Fixed, adjustable, and balloon"],0,
  "Appraisers develop value using the sales comparison approach (comparable sales), the cost approach (replacement cost less depreciation plus land), and the income approach (value from income potential). Residential appraisals rely most on sales comparison.",
  "USPAP; standard appraisal practice")
q(ORIG,"4.2.2","Appraiser independence","medium","application-scenario",
  "Appraiser independence rules prohibit an MLO from:",
  ["Providing the appraiser the purchase contract","Pressuring the appraiser to reach a target value","Ordering the appraisal","Paying the appraisal fee"],1,
  "It is prohibited to coerce or influence an appraiser toward a predetermined value. Supplying factual information such as the contract, ordering the appraisal, and paying the fee are permitted; conditioning payment on a value or hand-picking inflating appraisers is not.",
  "Regulation Z, 12 CFR \u00a71026.42")
q(ORIG,"4.2.3","Title report","medium","recall",
  "A preliminary title report primarily discloses:",
  ["The borrower's credit score","The state of title, including liens and encumbrances on the property","The appraised value","The interest rate"],1,
  "A preliminary title report reveals the current state of title: ownership, and any liens, easements, or encumbrances that must be resolved before closing. It supports issuance of title insurance protecting the lender and owner.",
  "Standard settlement practice")
q(ORIG,"4.2.4","Flood insurance","medium","application-scenario",
  "A property is located in a Special Flood Hazard Area with a federally related loan. The lender must:",
  ["Ignore flood risk","Require the borrower to obtain and maintain flood insurance","Deny the loan automatically","Provide flood insurance free"],1,
  "For a federally related loan on property in a Special Flood Hazard Area, federal law requires the borrower to obtain and maintain flood insurance for the life of the loan. Lenders must notify borrowers of the flood-zone determination.",
  "42 U.S.C. \u00a74012a (Flood Disaster Protection Act)")
q(ORIG,"4.2.4","PMI purpose","easy","recall",
  "Private mortgage insurance (PMI) on a conventional loan protects:",
  ["The borrower's credit score","The lender against loss if the borrower defaults","The appraiser","The title company"],1,
  "PMI protects the lender against loss on a high-LTV conventional loan if the borrower defaults. It is generally required above 80% LTV and can be canceled under the Homeowners Protection Act as equity builds.",
  "Homeowners Protection Act, 12 U.S.C. \u00a74901")
q(ORIG,"4.3.2","Power of attorney","medium","application-scenario",
  "A borrower cannot attend closing and wants someone to sign for them. This generally requires:",
  ["Nothing special","A valid power of attorney acceptable to the lender and title company","A notarized text message","The real estate agent's permission"],1,
  "Signing on a borrower's behalf requires a valid, specific power of attorney that the lender and title/settlement agent accept, often a limited or specific POA for the transaction. Requirements vary by state and investor.",
  "Standard settlement practice; state POA law")
q(ORIG,"4.3.3","Prepaid items","medium","recall",
  "At closing, 'prepaid' items typically include:",
  ["The real estate commission","Prepaid interest, and initial escrow deposits for taxes and insurance","The appraisal fee only","The down payment"],1,
  "Prepaids are amounts collected at closing for future obligations: per-diem interest to the end of the month, and initial escrow (reserve) deposits for property taxes and insurance. They are distinct from one-time settlement service fees.",
  "Regulation Z Closing Disclosure, 12 CFR \u00a71026.38")
q(ORIG,"4.3.5","Rescission and funding","medium","application-scenario",
  "On a refinance of a principal residence subject to rescission, loan funds are generally disbursed:",
  ["At the signing table","After the three-business-day rescission period expires","Before closing","Only after 30 days"],1,
  "For a rescindable transaction (e.g., a principal-residence refinance), the creditor may not disburse funds until the three-business-day rescission period has expired without the borrower canceling. Purchase loans, which are not rescindable, fund at closing.",
  "Regulation Z, 12 CFR \u00a71026.23(c)")
q(ORIG,"4.1.2","Gift funds","medium","application-scenario",
  "A borrower will use gift funds for the down payment. The MLO should:",
  ["Record them as the borrower's own income","Document the gift with a gift letter and verify the donor and transfer as program rules require","Ignore the source","Tell the borrower to call it a loan"],1,
  "Gift funds must be documented with a gift letter stating the amount, the donor, the relationship, and that no repayment is expected, plus a paper trail of the transfer as the loan program requires. Misrepresenting a gift as income or a repayable loan is fraud.",
  "Agency guidelines (Fannie/Freddie/FHA); accurate disclosure duty")

# ==================== ETHICS ====================
q(ETH,"5.1.1","Redlining","medium","application-scenario",
  "A lender refuses to make loans in certain neighborhoods based on their racial composition. This is:",
  ["Acceptable risk management","Redlining, a prohibited discriminatory practice","Required by underwriting","Permissible if disclosed"],1,
  "Refusing to lend or offering worse terms in areas because of their racial or ethnic composition is redlining, prohibited under ECOA and the Fair Housing Act. Lending decisions must rest on legitimate, non-discriminatory factors.",
  "Fair Housing Act, 42 U.S.C. \u00a73605; ECOA, 15 U.S.C. \u00a71691")
q(ETH,"5.1.1","Kickbacks","medium","application-scenario",
  "An MLO accepts concert tickets from a title company in exchange for steering closings to it. This is:",
  ["A permissible business gift","A prohibited thing of value for a referral under RESPA","Acceptable if under $100","Required to build relationships"],1,
  "A 'thing of value' (including tickets or entertainment) given or accepted for referring settlement-service business violates RESPA Section 8. There is no minimal-value exemption that makes referral-based gifts acceptable.",
  "12 U.S.C. \u00a72607; Regulation X, 12 CFR \u00a71024.14")
q(ETH,"5.1.2","Referral disclosure/ABA","hard","application-scenario",
  "An MLO refers borrowers to an affiliated title company they partly own. To comply with RESPA, they must:",
  ["Hide the relationship","Provide an Affiliated Business Arrangement disclosure and not require use of the affiliate","Charge the borrower extra","Pay the borrower a fee"],1,
  "Referrals to an affiliated provider are allowed only with a proper Affiliated Business Arrangement (ABA) disclosure of the relationship and the estimated charges, the referral must not be required (except for limited permitted services), and the only thing of value received must be a return on ownership.",
  "12 U.S.C. \u00a72607(c)(4); Regulation X, 12 CFR \u00a71024.15")
q(ETH,"5.1.3","Income fraud","medium","application-scenario",
  "A borrower's stated income far exceeds the amount on their tax returns and pay stubs, with no explanation. The MLO should:",
  ["Use the higher stated figure","Resolve the discrepancy and document verified income, escalating if it cannot be reconciled","Delete the tax returns","Average the two figures"],1,
  "A material income discrepancy is a fraud red flag. The MLO must reconcile it with verified documentation and, if it cannot be resolved, escalate rather than proceed. Using an unverifiable higher figure or destroying documents would be fraud.",
  "SAFE Act prohibited acts, 12 CFR \u00a71008.103; ATR verification")
q(ETH,"5.1.3","Occupancy fraud","medium","application-scenario",
  "A borrower states a property will be owner-occupied to get better terms but tells the MLO they will rent it out. The MLO should:",
  ["Submit it as owner-occupied anyway","Not misrepresent occupancy; the application must reflect the true intended use","Ignore the comment","Advise the borrower how to hide it"],1,
  "Occupancy status affects pricing and eligibility, so misrepresenting it is mortgage fraud. The application must reflect the borrower's true intended use (investment property here). Knowingly submitting a false occupancy claim exposes the MLO to liability.",
  "SAFE Act prohibited acts; general fraud prohibitions")
q(ETH,"5.1.3","Straw buyer","hard","application-scenario",
  "Someone offers to apply for a loan on behalf of a hidden real purchaser who cannot qualify. This scheme is:",
  ["A permitted co-borrower arrangement","A straw-buyer fraud that the MLO must not facilitate","Standard practice","Allowed with a POA"],1,
  "Using a straw buyer to conceal the true borrower who cannot qualify is mortgage fraud. The MLO must not facilitate it. Legitimate co-borrowers are disclosed and qualify on the application; concealment of the real party in interest is the violation.",
  "Fraud prohibitions; SAFE Act prohibited acts")
q(ETH,"5.1.5","Misleading advertising","medium","application-scenario",
  "Which advertisement is permissible under truth-in-advertising rules?",
  ["\"Guaranteed approval for everyone!\"","\"Rates as low as X% APR for qualified borrowers; terms apply\"","\"No income check, ever\"","\"Government-endorsed loans only here\""],1,
  "A truthful 'as low as' rate with an APR and a clear qualifier is acceptable. Guaranteeing universal approval, claiming no verification, or falsely implying government endorsement are deceptive and prohibited under Regulation N and UDAAP standards.",
  "Regulation N, 12 CFR Part 1014; UDAAP")
q(ETH,"5.1.6","Steering","medium","application-scenario",
  "Directing a borrower who qualifies for a prime loan into a higher-cost subprime loan to earn more is:",
  ["Acceptable with consent","Steering, which is prohibited","Required by the lender","Permitted if disclosed"],1,
  "Steering a qualified borrower into a costlier or riskier loan for the originator's benefit violates the anti-steering provisions and fair-lending principles. Borrower consent or disclosure does not cure it.",
  "Regulation Z, 12 CFR \u00a71026.36(e)")
q(ETH,"5.2.1","Fee splitting","medium","application-scenario",
  "Splitting an unearned settlement-service fee with a party who performed no service is:",
  ["Permissible if agreed","A prohibited practice under RESPA","Required for closings","Allowed for licensed MLOs"],1,
  "RESPA prohibits splitting a fee for settlement services where no work commensurate with the split was performed. Fees must reflect services actually rendered; splitting unearned fees is a Section 8 violation.",
  "12 U.S.C. \u00a72607(b)")
q(ETH,"5.2.2","Borrower complaints","medium","application-scenario",
  "A borrower submits a written complaint alleging an error in loan servicing. The proper response is to:",
  ["Ignore it","Acknowledge and investigate/respond within the required timeframes","Close the borrower's account","Refer them to a competitor"],1,
  "Servicers must acknowledge and respond to qualified written requests and notices of error within RESPA's specified timeframes, investigating and correcting errors as warranted. Ignoring a valid complaint exposes the servicer to liability.",
  "Regulation X, 12 CFR \u00a71024.35, \u00a71024.36")
q(ETH,"5.2.3","Material info to lender","medium","application-scenario",
  "During processing, the MLO learns the borrower just took on a large new car loan not on the application. The MLO should:",
  ["Say nothing to keep the file clean","Convey this material information to the underwriter/lender","Remove other debts to compensate","Advise the borrower to hide it"],1,
  "New debt materially affects DTI and the credit decision. The MLO has a duty to convey material information to the underwriter/lender. Concealing it or manipulating the file to offset it would be fraud.",
  "SAFE Act prohibited acts; duty of accurate disclosure to lender")
q(ETH,"5.2.4","Cybersecurity/PII","medium","application-scenario",
  "To protect borrowers' nonpublic personal information, an MLO should:",
  ["Email SSNs in plain text for speed","Use secure channels and safeguard NPI against unauthorized access","Post files on a public drive","Share logins with assistants"],1,
  "MLOs must safeguard nonpublic personal information using secure transmission and storage and controlled access, consistent with GLBA's Safeguards Rule. Emailing unencrypted SSNs, public storage, or shared logins create breach and identity-theft risk.",
  "GLBA Safeguards Rule; Regulation P, 12 CFR Part 1016")
q(ETH,"5.2.4","Multiple applications","medium","application-scenario",
  "A borrower reveals they have simultaneous mortgage applications at other lenders for other purchases. The MLO should:",
  ["Say nothing","Convey the material information to the underwriter, as concurrent financing affects risk","Cancel the application","Report the borrower to police"],1,
  "Undisclosed concurrent financing can hide liabilities or signal occupancy/straw-buyer schemes and is material to underwriting. The MLO's duty is to convey it, not conceal it or overreact by involving law enforcement.",
  "SAFE Act prohibited acts; accurate disclosure duty")
q(ETH,"5.2.4","Outside party requests","medium","application-scenario",
  "A relative who is not on the loan calls asking for the status and details of the borrower's application. The MLO should:",
  ["Share everything","Decline to disclose the borrower's nonpublic information without authorization","Confirm the loan amount only","Confirm whether the person applied"],1,
  "Borrower information is confidential. Without the borrower's authorization, the MLO must not disclose application details or even confirm that an application exists. Partial disclosures still breach the duty to protect the customer's information.",
  "GLBA privacy; Regulation P, 12 CFR Part 1016")

# ---- assemble concept list into records ----
records = []
for c in C:
    rec = dict(c)
    rec["last_reviewed_date"] = TODAY
    records.append(rec)

print(f"Curated concept questions authored: {len(records)}")

# ==================== PARAMETRIC CALCULATION GENERATORS ====================
def money(n): return "${:,.0f}".format(n)
def money2(n): return "${:,.2f}".format(n)

def near(correct, kind):
    # build 3 plausible distractors around a correct numeric value
    ds = set()
    for f in (0.9, 1.1, 0.8, 1.25, 0.75, 1.2):
        v = round(correct * f, 2)
        if abs(v - correct) > 0.005: ds.add(v)
    ds = list(ds)[:3]
    return ds

def mc(correct, distractors, fmt):
    opts = [correct] + distractors
    random.shuffle(opts)
    ci = opts.index(correct)
    return [fmt(o) for o in opts], ci

calc = []

# LTV (4.2.1)
for _ in range(9):
    value = random.choice([200000,225000,250000,275000,300000,320000,350000,400000])
    ltv = random.choice([0.80,0.85,0.90,0.95,0.75])
    loan = round(value*ltv)
    correct = round(loan/value*100, 1)
    opts, ci = mc(correct, [round(correct*1.1,1), round(correct*0.9,1), round(100-correct,1)], lambda o:f"{o}%")
    calc.append((ORIG,"4.2.1","Calculations - LTV","easy","calculation",
      f"A property is valued at {money(value)} and the loan amount is {money(loan)}. What is the loan-to-value ratio?",
      opts, ci,
      f"LTV = loan / value = {money(loan)} / {money(value)} = {correct}%. Lenders use the lesser of sale price or appraised value as the denominator.",
      "Standard underwriting; LTV usage 12 CFR \u00a71026.32"))

# DTI back-end (4.2.1)
for _ in range(8):
    income = random.choice([5000,6000,7000,7500,8000,9000,10000])
    housing = round(income*random.choice([0.22,0.25,0.28]))
    debts = round(income*random.choice([0.05,0.08,0.10,0.12]))
    correct = round((housing+debts)/income*100, 1)
    opts, ci = mc(correct, [round(housing/income*100,1), round(correct*1.15,1), round(correct*0.85,1)], lambda o:f"{o}%")
    calc.append((ORIG,"4.2.1","Calculations - DTI","medium","calculation",
      f"Gross monthly income is {money(income)}. The proposed housing payment is {money(housing)} and other monthly debts total {money(debts)}. What is the back-end DTI?",
      opts, ci,
      f"Back-end DTI = (housing + other debts) / income = ({money(housing)} + {money(debts)}) / {money(income)} = {correct}%.",
      "Standard underwriting; ATR DTI 12 CFR \u00a71026.43(c)(7)"))

# Discount points (4.4.4)
for _ in range(6):
    loan = random.choice([150000,175000,180000,200000,225000,250000,300000])
    pts = random.choice([1,1.5,2,2.5,3])
    correct = round(loan*pts/100, 2)
    opts, ci = mc(correct, near(correct,"pts"), money)
    calc.append((ORIG,"4.4.4","Calculations - points","easy","calculation",
      f"A borrower pays {pts} discount point(s) on a {money(loan)} loan. How much is that in dollars?",
      opts, ci,
      f"One point = 1% of the loan amount. {pts}% of {money(loan)} = {money(correct)}.",
      "Points as prepaid finance charge, 12 CFR \u00a71026.4"))

# Per-diem interest (4.4.1)
for _ in range(6):
    loan = random.choice([180000,200000,240000,260000,300000])
    rate = random.choice([0.05,0.055,0.06,0.065,0.07])
    days = random.choice([8,10,12,15,18])
    correct = round(loan*rate/360*days, 2)
    opts, ci = mc(correct, near(correct,"pd"), money2)
    calc.append((ORIG,"4.4.1","Calculations - per diem interest","medium","calculation",
      f"A {money(loan)} loan at {rate*100:.2f}% closes with {days} days of prepaid interest, using a 360-day year. How much prepaid interest is collected?",
      opts, ci,
      f"Per-diem interest = loan x rate / 360 x days = {money(loan)} x {rate:.4f} / 360 x {days} = {money2(correct)}.",
      "Prepaid interest on the Closing Disclosure, 12 CFR \u00a71026.38"))

# Down payment (4.4.3)
for _ in range(6):
    price = random.choice([200000,240000,275000,300000,350000,425000])
    dp = random.choice([0.035,0.05,0.10,0.15,0.20])
    correct = round(price*dp, 2)
    opts, ci = mc(correct, near(correct,"dp"), money)
    calc.append((ORIG,"4.4.3","Calculations - down payment","easy","calculation",
      f"A home is purchased for {money(price)} with a {dp*100:.1f}% down payment. What is the down payment in dollars?",
      opts, ci,
      f"Down payment = price x down% = {money(price)} x {dp:.3f} = {money(correct)}. The loan amount is the price minus the down payment.",
      "Standard purchase calculation"))

# ARM first adjustment (4.4.5)
for _ in range(5):
    index = random.choice([3.0,3.5,4.0,4.25,4.5])
    margin = random.choice([2.0,2.25,2.5,2.75])
    start = random.choice([4.0,4.5,5.0])
    init_cap = random.choice([1,2])
    fully = index+margin
    capped = min(fully, start+init_cap)
    correct = round(capped,3)
    opts, ci = mc(correct, [round(fully,3), round(start+init_cap+0.5,3), round(start,3)], lambda o:f"{o:.3f}%")
    calc.append((GEN,"3.2.2","Calculations - ARM adjustment","hard","calculation",
      f"An ARM has a start rate of {start:.2f}%, index {index:.2f}%, margin {margin:.2f}%, and an initial adjustment cap of {init_cap:.0f}%. What is the rate at first adjustment?",
      opts, ci,
      f"Fully indexed rate = index + margin = {index:.2f}% + {margin:.2f}% = {fully:.2f}%. The initial cap limits the increase to start + {init_cap:.0f}% = {start+init_cap:.2f}%. The new rate is the lower of the two = {correct:.3f}%.",
      "ARM disclosures, 12 CFR \u00a71026.20(c)"))

for t in calc:
    records.append({"content_area":t[0],"outline_ref":t[1],"subtopic":t[2],"difficulty":t[3],
                    "type":t[4],"stem":t[5],"options":t[6],"correct_index":t[7],
                    "explanation":t[8],"primary_source_citation":t[9],"last_reviewed_date":TODAY})

print(f"Parametric calculation questions generated: {len(calc)}")

# ---- merge with existing tagged questions.json (preserve the original 30) ----
existing = json.load(open(os.path.join(HERE,"base_seed.json")))["questions"]  # frozen 30-question base (reproducible)
all_q = existing + records

# assign clean sequential ids grouped by area
order = {FED:1, STATE:2, GEN:3, ORIG:4, ETH:5}
all_q.sort(key=lambda x:(order[x["content_area"]], x["outline_ref"]))
for i,q_ in enumerate(all_q, 1):
    q_["id"] = f"Q{i:04d}"
    # normalize key order
    for k in ["subtopic","difficulty","type","primary_source_citation","last_reviewed_date"]:
        q_.setdefault(k, None)

out = {
  "meta": {
    "version":"0.3","total":len(all_q),
    "note":"First-draft bank. Concept questions authored clean-room from primary sources; calculation questions generated parametrically with computed answers. Requires SME accuracy review and legal review before commercial use.",
    "outline_source":"content/outline.json (official NMLS Test Content Outline)",
    "id_note":"Question ids are opaque; content_area and outline_ref are authoritative."
  },
  "questions": all_q
}
json.dump(out, open(os.path.join(HERE,"questions.json"),"w"), indent=2, ensure_ascii=False)
print(f"TOTAL written to questions.json: {len(all_q)}")
