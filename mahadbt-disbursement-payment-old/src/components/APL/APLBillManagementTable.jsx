import React, { useEffect, useState } from 'react';
import { saveSelectedBeneficiarie, getBills, getDataBaseOnBillNumber, saveSelectedBeneficiarieAPL, saveSelectedBeneficiarieAPLMock } from "./../../api/save"; import BillSubmission from "./APLBillSubmission";
import { getObjectName } from './../../api/fetch-scheme';
import jsPDF from 'jspdf';


// Import pdfmake
import pdfMake from 'pdfmake/build/pdfmake.min';
import pdfMakeVfs from 'pdfmake/build/vfs_fonts';

// Setup pdfmake with fonts
pdfMake.vfs = pdfMakeVfs;

const APLBillManagementTable = ({ selectedBeneficiaries = [], apiRes, allocateInputData, isPensionRole = false, searchData }) => {
  console.log("Befen:::",isPensionRole, "isPensionRole", selectedBeneficiaries);
  console.log("API allocated Input:::", allocateInputData);
  const [loginUserId, setLoginUserId] = useState(null);
  const [responseData, setResponseData] = useState([]);
  const [submittedBillList, setSubmittedBillList] = useState([]);
  const [generatingBillId, setGeneratingBillId] = useState(null);
  const [billSubmitted, setBillSubmitted] = useState(false);

  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pfxPassword, setPfxPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingRowData, setPendingRowData] = useState(null);
  const [pendingBase64Pdf, setPendingBase64Pdf] = useState(null);
  const [pendingFileName, setPendingFileName] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPageState, setEntriesPerPageState] = useState(10);

  const SNO_ROLES = ["pension sno", "assistance sno", "stipend sno", "pre matric sno"];

  const roleNames =
    apiRes?.userRoles?.map(role => (role?.name || role || "").toString().toLowerCase().trim()) || [];

  const isSnoRole = roleNames.some(role => SNO_ROLES.includes(role));

  // Setup fonts on component mount
  useEffect(() => {
    // Configure fonts for Devanagari support
    console.log("Step 4.5 - setting up fonts");
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
      },
      NotoDevanagari: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
      }
    };
  }, []);

  useEffect(() => {
    const userId = window.Liferay.ThemeDisplay.getUserId();
   setLoginUserId(userId);
   console.log("Step 5 - userId set to", userId);

    const saveData = async () => {
      try {
        console.log("Step 6 - calling saveSelectedBeneficiarie with", allocateInputData);
       const resp =  await saveSelectedBeneficiarieAPLMock(
          selectedBeneficiaries,
          apiRes,
          allocateInputData,
          userId
        );
        console.log("Save response:", resp);

        const pendingBill = await getBills(userId);

        const mappedData = pendingBill.map(item => ({
          ...item,
          beneficiaryAllocatedCount: Number(item.beneficiaryCount || 0),
          submittedBillStatus: item.submittedStatus,
          paymentAuthorizationLetter: item.paymentAuthLetter,
          mtr: item.mtrFile,
          beneficiaryListExport: item.beneficiaryExport,
          beams: item.beamsStatus
        }));

        setResponseData(mappedData);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    saveData();
  }, [selectedBeneficiaries, apiRes, allocateInputData]);

  const tableData = responseData || [];

  // Pagination calculations
  const indexOfLastEntry = currentPage * entriesPerPageState;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPageState;
  const currentEntries = tableData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(tableData.length / entriesPerPageState);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleEntriesPerPageChange = (e) => {
    setEntriesPerPageState(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSubmitBill = async (rowData) => {
    const res = await getDataBaseOnBillNumber(rowData.billNumber, apiRes.schemeData);
    setSubmittedBillList(res);
  };

  // Auto-trigger for pension role when responseData loads
  useEffect(() => {
    if (isPensionRole && !billSubmitted && tableData.length > 0 && submittedBillList.length === 0) {
      const pendingBill = tableData.find(
        item => item.submittedStatus === "Pending" && !item.beamsPdfUrl && !item.beamsPdfId
      );
      if (pendingBill) {
        handleSubmitBill(pendingBill);
      }
    }
  }, [tableData, isPensionRole, billSubmitted]);

  const handleCancelBill = (rowData) => {
    alert(`Cancel bill for Bill Number: ${rowData.billNumber}`);
  };

  const formatAmountIndian = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "0.00";
    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₹ 0';
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const formatDateLong = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const numberToWordsIndian = (value) => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertBelowThousand = (num) => {
      let words = "";
      if (num >= 100) {
        words += `${ones[Math.floor(num / 100)]} Hundred `;
        num %= 100;
      }
      if (num >= 20) {
        words += `${tens[Math.floor(num / 10)]} `;
        num %= 10;
      }
      if (num > 0) {
        words += `${ones[num]} `;
      }
      return words.trim();
    };

    const integerValue = Math.floor(Number(value) || 0);
    if (!integerValue) return "Zero";

    const parts = [
      { divisor: 10000000, label: "Crore" },
      { divisor: 100000, label: "Lakh" },
      { divisor: 1000, label: "Thousand" },
      { divisor: 1, label: "" },
    ];

    let remaining = integerValue;
    const words = [];

    parts.forEach(({ divisor, label }) => {
      if (remaining >= divisor) {
        const chunk = divisor === 1 ? remaining : Math.floor(remaining / divisor);
        if (chunk > 0) {
          words.push(convertBelowThousand(chunk));
          if (label) words.push(label);
          remaining %= divisor;
        }
      }
    });

    return words.join(" ").replace(/\s+/g, " ").trim();
  };

  const amountToWordsIndian = (value) => {
    const numericValue = Number(value) || 0;
    const rupees = Math.floor(numericValue);
    const paise = Math.round((numericValue - rupees) * 100);
    const rupeesPart = `${numberToWordsIndian(rupees)} Rupees`;
    if (!paise) return `${rupeesPart} Only`;
    return `${rupeesPart} and ${numberToWordsIndian(paise)} Paise Only`;
  };

  const fetchImageAsDataURL = async (url) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading image:", error);
      return null;
    }
  };


  const buildGrantInAidPdfDefinition = async (rowData, billDataFromAPI) => {
    try {

      let beamsData = {};

      // Safe parsing (string or object)
      if (typeof rowData?.beamsPdfData === "string") {
        try {
          beamsData = JSON.parse(rowData.beamsPdfData);
        } catch (e) {
          console.error("Invalid JSON in beamsPdfData", e);
          beamsData = {};
        }
      } else {
        beamsData = rowData?.beamsPdfData || {};
      }

      // Merge bill data
      const billData = {
        billNo: rowData?.billNumber || "336498344",
        ddoCode: beamsData?.ddoCode || rowData?.ddoCode || "7101002015",
        officeVoucherNo: "E/259",
        treasuryCertDate: "",
        controllingOfficerNo: "",
        sanctionDate: new Date().toISOString().split("T")[0],
        authorizationLetterNo: beamsData?.authNo || rowData?.authorizationLetterNo,
        adminDept: beamsData?.adminDept || rowData?.adminDept,
        demandNo: "ZE-01",
        majorHead: beamsData?.majorHead || "2235",
        minorHead: beamsData?.minorHead || "200",
        subHead: beamsData?.subhead || "",
        detailHead: beamsData?.detailHead || rowData?.detailHead,
        subDetailHead: beamsData?.subDetailHead || rowData?.subDetailHead,
        schemeCode: beamsData?.schemeCode || rowData?.schemeCode,
        schemeName: rowData?.schemeName,
        grossAmount: rowData?.allocatedAmount || 0,
        annualGrantAmount: "292253774.000",
        deductionAmount: "0",
        spentAmount: "292253672",
        netPayableAmount: rowData?.allocatedAmount || 0,
        remainingGrantAmount: "102.00",
        officeDetails: beamsData?.address || rowData?.officeDetails,
        billMonthYear: new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        schemeDescription: "Scholarship for students of minority communities pursuing Higher and Professional courses (DTE)",
        totalDemandAmount: rowData?.allocatedAmount || 0,
        totalDemandAmountWords: "EIGHT CRORES ONE LACS FOURTEEN THOUSAND THREE HUNDRED AND SEVENTY FOUR Only",
        netPayableAmountWords: "EIGHT CRORES ONE LACS FOURTEEN THOUSAND THREE HUNDRED AND SEVENTY THREE Only",
        deductionAmountWords: "ZERO",
        beneficiarySerialNo: "09",
        beneficiaryName: beamsData?.bankACName || rowData?.beneficiaryName || "",
        beneficiaryPanNo: "",
        beneficiaryBankName: beamsData?.bankName || rowData?.beneficiaryBankName,
        beneficiaryBranchName: beamsData?.bankBranchName || rowData?.beneficiaryBranchName,
        beneficiaryAccountNo: beamsData?.bankACNumber || rowData?.beneficiaryAccountNo,
        beneficiaryAmount: 90000 || 0,
        financialYear: rowData?.financialYear
          || `${beamsData?.budgetYear1 || new Date().getFullYear()}-${beamsData?.budgetYear2 || new Date().getFullYear() + 1}`, beamsPdfUrl: beamsData?.url,
        beamsPdfId: beamsData?.fileEntryId,
        beamsData: beamsData,
      };

      // Helper functions
      const mr = (text, bold, size, align) => ({
        text: text || "",
        bold: !!bold,
        fontSize: size || 8.5,
        alignment: align || "left",
        font: "NotoDevanagari",
      });

      const en = (text, bold, size, align) => ({
        text: text || "",
        bold: !!bold,
        fontSize: size || 8.5,
        alignment: align || "left",
        font: "Roboto",
      });

      const mix = (parts, align) => ({
        text: parts.map(p => ({
          text: p.text || "",
          bold: !!p.bold,
          fontSize: p.size || 8.5,
          font: p.mr ? "NotoDevanagari" : "Roboto",
        })),
        alignment: align || "left",
      });

      const NOBORDER = [false, false, false, false];
      const ALLBORDER = [true, true, true, true];
      const BOTBORDER = [false, false, false, true];
      const TOPBORDER = [false, true, false, false];
      const TBBORDER = [false, true, false, true];

      const cell = (content, border, margin) => ({
        border: border || NOBORDER,
        margin: margin || [3, 2, 3, 2],
        ...content,
      });

      // Generate barcode canvas
      const barcanvas = [];
      for (let bi = 0; bi < 38; bi++) {
        barcanvas.push({
          type: "rect",
          x: bi * 3.8,
          y: 0,
          w: bi % 3 === 0 ? 2.5 : 1,
          h: 18,
          color: "black",
        });
      }

      // Load images
      const HEADER_LOGO_LEFT_URL = "https://mahadbt2-uat-dashboard.quantela.com/documents/20118/52807/image.png";
      const HEADER_LOGO_RIGHT_URL = "https://mahadbt2-uat-dashboard.quantela.com/documents/20118/52807/image+83.png";

      let headerLogoLeftDataUrl = null;
      let headerLogoRightDataUrl = null;

      try {
        const [leftImg, rightImg] = await Promise.all([
          fetchImageAsDataURL(HEADER_LOGO_LEFT_URL),
          fetchImageAsDataURL(HEADER_LOGO_RIGHT_URL)
        ]);
        headerLogoLeftDataUrl = leftImg;
        headerLogoRightDataUrl = rightImg;
      } catch (e) {
        console.warn("Could not load header images, continuing without them");
      }

      const formatAmountIndian = (value) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return "0.00";
        return amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      };

      // Build PDF document with proper pagination
      const dd = {
        pageSize: "A4",
        pageMargins: [28, 28, 28, 28],
        defaultStyle: { font: "NotoDevanagari", fontSize: 8.5 },
        content: [
          // ==================== PAGE 1 ====================
          {
            // Header with logos
            columns: [
              {
                width: headerLogoLeftDataUrl ? 80 : 150,
                stack: headerLogoLeftDataUrl ? [{
                  image: headerLogoLeftDataUrl,
                  width: 80,
                  height: 40,
                  alignment: "center",
                }] : [{ text: "\u00a0", fontSize: 1, color: "#ffffff" }],
              },
              {
                width: "*",
                stack: [
                  {
                    text: "महाराष्ट्र शासन",
                    bold: true,
                    fontSize: 16,
                    alignment: "center",
                    font: "NotoDevanagari",
                    margin: [0, 10, 0, 2],
                  },
                  {
                    text: "मकोनि - 44",
                    bold: true,
                    fontSize: 14,
                    alignment: "center",
                    font: "NotoDevanagari",
                    margin: [0, 0, 0, 0],
                  },
                ],
              },
              {
                width: "auto",
                stack: [
                  { canvas: barcanvas, margin: [0, 0, 0, 2] },
                  {
                    text: billData.authorizationLetterNo,
                    fontSize: 7.5,
                    alignment: "right",
                    font: "Roboto",
                  },
                  mr("पहा नियम - 391", false, 7.0, "left"),
                ],
                alignment: "right",
              },
            ],
            margin: [0, 5, 0, 10],
          },

          // Title
          {
            columns: [
              {
                width: "*",
                text: [
                  mr("सहाय्यक अनुदानाचे देयक", true, 9),
                  en("(Grant In Aid Bill) ", true, 9),
                  mr("आणि देयक प्राधिकार पत्र", true, 9),
                ],
              },
              {
                width: "auto",
                text: [
                  mr("दिनांक", false, 8.5),
                  en(new Date().toLocaleDateString('en-GB'), false, 8.5),
                  mr("पर्यंत वैध", false, 8.5),
                ],
              },
            ],
            margin: [0, 0, 0, 5],
          },

          // Table 1
          {
            table: {
              widths: [100, 145, "*"],
              body: [
                [
                  cell(en("7101|P.A.O.", true, 9), TBBORDER),
                  cell(mr(" आ. सं. अधिकारी संकेतांक"), TBBORDER),
                  cell(en(billData.ddoCode || "", true, 9), TBBORDER),
                ],
                [
                  cell(mr("कोषागाराचा देयक क्रमांक"), BOTBORDER),
                  cell(mr("आ. सं. अधिकारी पदनाम "), BOTBORDER),
                  {
                    stack: [
                      en("ACCOUNTS OFFICER", true, 8.5),
                      en("DIRECTORATE OF TECHNICAL", false, 8.5),
                      en("EDUCATION MAHARASHTRA", false, 8.5),
                      en("STATE MUMBAI - 400001", false, 8.5),
                    ],
                    border: BOTBORDER,
                    margin: [3, 2, 3, 2],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.6,
              vLineWidth: () => 0.6,
            },
            margin: [0, 0, 0, 4],
          },

          // Table 2
          {
            table: {
              widths: [165, 125, "*"],
              body: [
                [
                  cell(mr("कोषागार प्रमाणक क्रमांक")),
                  cell(mr("कार्यालय देयक क्रमांक")),
                  cell(en(billData.officeVoucherNo, true, 9)),
                ],
                [
                  cell(mr("कोषागार प्रमाणक दिनांक")),
                  cell(mr("दिनांक")),
                  cell(en("")),
                ],
                [
                  cell(mr("नियंत्रक अधिकारी क्रमांक")),
                  cell(en("")),
                  cell(en("")),
                ],
                [
                  cell(mr("नियंत्रक अधिकारी पदनाम")),
                  cell(mr("आ. सं. अधिकारी टॅन क्र.")),
                  cell(en("")),
                ],
                [
                  cell(mr("अर्थसंकल्प प्राधिकार पत्र क्र.")),
                  {
                    columns: [
                      {
                        width: "*",
                        stack: [
                          {
                            text: [en(billData.authorizationLetterNo, true, 8.5)],
                            alignment: "center",
                          },
                        ],
                      },
                      {
                        width: "auto",
                        stack: [
                          mix(
                            [
                              { text: "दिनांक: ", mr: true },
                              { text: billData.sanctionDate },
                            ],
                            "right",
                          ),
                        ],
                      },
                    ],
                    colSpan: 2,
                    border: NOBORDER,
                    margin: [3, 2, 3, 2],
                  },
                  cell(en("")),
                ],
              ],
            },
            layout: "noBorders",
            margin: [0, 0, 0, 3],
          },

          // Accounting Head Table
          {
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    text: [mr("लेखांकन तपशिल", true, 10.5, "center")],
                    alignment: "center",
                    border: ALLBORDER,
                    margin: [0, 3, 0, 3],
                  },
                ],
                [
                  {
                    text: [
                      mr("योजनांतर्गत ", false, 8.5, "center"),
                      en("(Plan), ", false, 8.5, "center"),
                      mr("दत्तमत ", false, 8.5, "center"),
                      en("(Voted), ", false, 8.5, "center"),
                      mr("एकत्रित निधी ", false, 8.5, "center"),
                      en("(Consolidated Fund)", false, 8.5, "center"),
                    ],
                    alignment: "center",
                    border: [true, false, true, true],
                    margin: [0, 2, 0, 2],
                  },
                ],
                [
                  {
                    text: [mr("लेखाशिर्ष", true, 9.5, "center")],
                    alignment: "center",
                    border: [true, false, true, true],
                    margin: [0, 2, 0, 2],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.7,
              vLineWidth: () => 0.7,
            },
            margin: [0, 0, 0, 0],
          },

          // Budget Details
          {
            table: {
              widths: [165, "*"],
              body: [
                [
                  cell(mix([{ text: "प्रशासकीय विभाग ", mr: true }, { text: "[Admin Dept.]" }])),
                  cell(en(billData.adminDept, true, 8.5)),
                ],
                [
                  cell(mix([{ text: "गणी क्र. ", mr: true }, { text: "[Demand No.]" }])),
                  cell(en(billData.demandNo, true, 8.5)),
                ],
                [
                  cell(mix([{ text: "मुख्यशिर्ष ", mr: true }, { text: "[Major Head]" }])),
                  cell(en(billData.majorHead, true, 8.5)),
                ],
                [
                  cell(mix([{ text: "गौणशिर्ष ", mr: true }, { text: "[Minor Head]" }])),
                  cell(en(billData.minorHead, false, 8.5)),
                ],
                [
                  cell(mix([{ text: "उपशिर्ष ", mr: true }, { text: "[sub head]" }])),
                  cell(en(billData.subHead, false, 8.5)),
                ],
                [
                  cell(mix([{ text: "तपशिलवारशिर्ष ", mr: true }, { text: "[Detail Head]" }])),
                  cell(en(billData.detailHead, true, 8.5)),
                ],
                [
                  cell(mix([{ text: "उपतपशिलवारशिर्ष ", mr: true }, { text: "[Sub Detail Head]" }])),
                  cell(en(billData.subDetailHead, true, 8.5)),
                ],
                [
                  cell(mix([{ text: "जना संकेतांक ", mr: true }, { text: "[Scheme Code]" }])),
                  cell(en(billData.schemeCode + "|" + billData.schemeName, false, 8.5)),
                ],
              ],
            },
            layout: {
              hLineWidth: (i, n) => i === 0 || i === n ? 0.7 : 0.3,
              vLineWidth: () => 0.7,
            },
            margin: [0, 0, 0, 0],
          },

          // Amount Summary Table
          {
            table: {
              widths: ["*", "*"],
              body: [
                [
                  cell(mix([{ text: "देयकाची स्थूल रक्कम ", mr: true }, { text: "[" + billData.grossAmount + "]" }]), ALLBORDER),
                  cell(mix([{ text: "एकूण वार्षिक अनुदान ₹", mr: true }, { text: "[" + billData.annualGrantAmount + "]" }]), ALLBORDER),
                ],
                [
                  cell(mix([{ text: "वजातीची रक्कम ", mr: true }, { text: "[" + billData.deductionAmount + "]" }]), ALLBORDER),
                  cell(mix([{ text: "हे देयक धरून झालेला खर्च ₹ ", mr: true }, { text: "[" + billData.spentAmount + "]" }]), ALLBORDER),
                ],
                [
                  cell(mix([{ text: "देयकाची निव्वळ रक्कम ", mr: true }, { text: "[" + billData.netPayableAmount + "]" }]), ALLBORDER),
                  cell(mix([{ text: "\u0936\u093f\u0932\u094d\u0932\u0915 \u0905\u0928\u0941\u0926\u093e\u0928 \u20b9 ", mr: true }, { text: "[" + billData.remainingGrantAmount + "]" }]), ALLBORDER),
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.6,
              vLineWidth: () => 0.6,
            },
            margin: [0, 0, 0, 5],
          },

          // Office Details
          {
            text: [
              en((billData.officeDetails || "") + " ", true, 8.5),
              mr("या कार्यालयाचे ", false, 8.5),
              en((billData.billMonthYear || "") + " ", false, 8.5),
              mr("या महिन्याचे सहाय्यक अनुदानाचे देयक.", false, 8.5),
            ],
            margin: [0, 0, 0, 5],
          },

          // Scheme Description Table
          {
            table: {
              widths: ["*", 110],
              body: [
                [
                  cell(en(""), TOPBORDER),
                  cell({
                    text: [mr("रक्कम ", true, 9), en("(Amount)", true, 9)],
                    alignment: "center",
                    border: ALLBORDER,
                    margin: [3, 3, 3, 3],
                  }),
                ],
                [
                  {
                    text: [en(billData.schemeDescription, false, 8.5)],
                    border: ALLBORDER,
                    margin: [3, 3, 3, 3],
                  },
                  cell(en(billData.netPayableAmount || "", true, 8.5, "center"), ALLBORDER),
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.7,
              vLineWidth: () => 0.7,
            },
            margin: [0, 0, 0, 0],
          },

          // Amount in Words
          {
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    border: ALLBORDER,
                    margin: [4, 4, 4, 4],
                    text: [
                      en((billData.totalDemandAmount || "") + " /- ", false, 8.5),
                      mr("रुपयांच्या आत. ( ", false, 8.5),
                      en(billData.totalDemandAmountWords || "", false, 8.5),
                      mr(") एकूण मागणी रक्कम रुपये ", false, 8.5),
                      en((billData.netPayableAmount || "") + "/- ", false, 8.5),
                      mr("(अक्षरी) रु. ", false, 8.5),
                      en(billData.netPayableAmountWords || "", false, 8.5),
                      mr(", समायोजनाने वर्ग करावयाची रक्कम  ", false, 8.5),
                      en((billData.deductionAmount || "") + "/ ", false, 8.5),
                      mr("(अक्षरी) रु.शून्य ", false, 8.5),
                      en((billData.deductionAmountWords || "") + " Only", false, 8.5),
                      mr(", व्वळ रक्कम रु. ", false, 8.5),
                      en((billData.netPayableAmount || "") + " /- ", false, 8.5),
                      mr("(अक्षरी)न रुपये ", false, 8.5),
                      en(billData.netPayableAmountWords || "", false, 8.5),
                      mr(", प्रदानार्थ संगत. ", false, 8.5),
                    ],
                  },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.7,
              vLineWidth: () => 0.7,
            },
            margin: [0, 0, 0, 20],
          },

          // ==================== PAGE 2 ====================
          {
            pageBreak: "before",
            margin: [0, 0, 0, 0],
            stack: [
              // Beneficiary Table
              {
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => "#000000",
                  vLineColor: () => "#000000",
                },
                table: {
                  widths: ["8%", "26%", "15%", "12%", "12%", "15%", "12%"],
                  headerRows: 1,
                  body: [
                    [
                      { text: "अ.क्र.", alignment: "center", bold: true, fontSize: 9, font: "NotoDevanagari", margin: [2, 4, 2, 4] },
                      { text: "नाव/पदनाम ", alignment: "center", bold: true, fontSize: 9, font: "NotoDevanagari", margin: [2, 4, 2, 4] },
                      { text: "पॅन", alignment: "center", bold: true, fontSize: 9, font: "NotoDevanagari", margin: [2, 4, 2, 4] },
                      { text: "बँक", alignment: "center", bold: true, fontSize: 9, font: "NotoDevanagari", margin: [2, 4, 2, 4] },
                      { text: "शाखा", alignment: "center", bold: true, fontSize: 9, font: "NotoDevanagari", margin: [2, 4, 2, 4] },
                      { text: "खाते क्रमांक", alignment: "center", bold: true, fontSize: 9, font: "NotoDevanagari", margin: [2, 4, 2, 4] },
                      { text: "रक्कम", alignment: "center", bold: true, fontSize: 9, font: "NotoDevanagari", margin: [2, 4, 2, 4] },
                    ],
                    [
                      { text: billData.beneficiarySerialNo || "", alignment: "center", fontSize: 9, font: "Roboto", margin: [2, 4, 2, 4] },
                      { text: billData.beneficiaryName || "", alignment: "left", fontSize: 8, font: "Roboto", margin: [2, 4, 2, 4] },
                      { text: billData.beneficiaryPanNo || "", alignment: "center", fontSize: 9, font: "Roboto", margin: [2, 4, 2, 4] },
                      { text: billData.beneficiaryBankName || "", alignment: "left", fontSize: 8, font: "Roboto", margin: [2, 4, 2, 4] },
                      { text: billData.beneficiaryBranchName || "", alignment: "left", fontSize: 8, font: "Roboto", margin: [2, 4, 2, 4] },
                      { text: billData.beneficiaryAccountNo || "", alignment: "center", fontSize: 9, font: "Roboto", margin: [2, 4, 2, 4] },
                      { text: formatAmountIndian(billData.beneficiaryAmount), alignment: "right", fontSize: 9, font: "Roboto", margin: [2, 4, 2, 4] },
                    ],
                    [
                      { text: "एकूण ", colSpan: 6, alignment: "left", bold: true, fontSize: 9, font: "NotoDevanagari", margin: [2, 4, 2, 4] },
                      {}, {}, {}, {}, {},
                      { text: formatAmountIndian(billData.beneficiaryAmount), alignment: "right", bold: true, fontSize: 9, font: "Roboto", margin: [2, 4, 2, 4] },
                    ],
                  ],
                },
                margin: [28, 0, 28, 15],
              },

              // Certificates
              {
                stack: [
                  {
                    text: "अ) प्रमाणित करण्यात येते की, सदरची मागणी तयार करताना मु. वि. नि. 1959, म.को.नि 1968 व त्या अंतर्गत आज अखेरपर्यंत झालेल्या सुधारणा तसेच याविषयी आज अखेरपर्यंत निर्गमित करण्यात आलेले सर्व शासन निर्णय/शासन परिपत्रकामधील लागू असलेल्या सर्व तरतुदींची खात्री करण्यात आलेली असून उपरोक्त सर्व नियमांमधील विहित अटी व शर्तीचे व वित्तीय औचित्याच्या सूत्रांचे पालन करून हे देयक प्रदानार्थ कोषागारास सादर करण्यात येत आहे. ",
                    font: "NotoDevanagari",
                    fontSize: 8.5,
                    lineHeight: 1.2,
                    margin: [28, 0, 28, 8],
                  },
                  {
                    text: "ब) प्रमाणित करण्यात येते की, सदरची मागणी तयार करताना आदात्यांच्या बँक खातेक्रमांकांचा तपशील योग्य असल्याची खात्री करण्यात आलेली असून त्याप्रमाणे प्रदान करण्यास संमती देण्यात येत आहे. ",
                    font: "NotoDevanagari",
                    fontSize: 8.5,
                    lineHeight: 1.2,
                    margin: [28, 0, 28, 8],
                  },
                  {
                    text: "क) प्रमाणित करण्यात येते की, सदरचे देयक या पूर्वी उपकोषागारे/कोषागारे/अधिदान व लेखा कार्यालयाने पारित करून प्रदान केले नसल्याबाबत या कार्यालयाच्या देयक नोंदवहीवरून तथा पारगमन नोंदवहीवरून खात्री करण्यात आलेली आहे. ",
                    font: "NotoDevanagari",
                    fontSize: 8.5,
                    lineHeight: 1.2,
                    margin: [28, 0, 28, 8],
                  },
                  {
                    text: "ड) प्रमाणित करण्यात येते की, या देयकान्वये मंजूर करण्याचे अनुदान हे लोकहितार्थ तथा शासकीय कामकाजास्तव आवश्यक आहे. खर्चास सक्षम प्राधिकाऱ्यानी मंजुरी दिलेली असून खर्च मंजुरी अधिकारी अशी मंजुरी देण्यास सक्षम आहेत. ",
                    font: "NotoDevanagari",
                    fontSize: 8.5,
                    lineHeight: 1.2,
                    margin: [28, 0, 28, 8],
                  },
                  {
                    text: "इ) प्रमाणित करण्यात येते की, यापूर्वी आहरित देयकाचे उपयोगिता प्रमाणपत्र महालेखापाल कार्यालयास सादर केलेले आहे. ",
                    font: "NotoDevanagari",
                    fontSize: 8.5,
                    lineHeight: 1.2,
                    margin: [28, 0, 28, 15],
                  },
                ],
              },

              {
                text: "---------------------------------------------------------------------------------------------------- ",
                font: "Roboto",
                margin: [28, 0, 28, 8],
              },
              {
                text: "\u092a\u094d\u0930\u0936\u094d\u0928/\u092a\u094d\u0930\u092e\u093e\u0923\u093f\u0924",
                bold: true,
                fontSize: 10,
                font: "NotoDevanagari",
                margin: [28, 0, 28, 8],
              },
              {
                layout: {
                  hLineWidth: () => 0.5,
                  vLineWidth: () => 0.5,
                  hLineColor: () => "#000000",
                  vLineColor: () => "#000000",
                },
                table: {
                  widths: ["*", "*"],
                  body: [
                    [
                      {
                        text: "/श्रीमती ............................ यांना सदर देयक प्रकरणी संदेशवाहक म्हणून प्राधिकृत करण्यात येत आहे. त्यांची नमुना स्वाक्षरी पुढीलप्रमाणे आहे. ............................ संदेशवाहकाची स्वाक्षरी",
                        font: "NotoDevanagari",
                        fontSize: 8.5,
                        lineHeight: 1.25,
                        alignment: "left",
                        colSpan: 2,
                        border: ALLBORDER,
                        margin: [5, 5, 5, 5],
                      },
                      {},
                    ],
                    [
                      {
                        text: [
                          { text: "प्रदानार्थ संमत ", font: "NotoDevanagari", fontSize: 8.5 },
                          { text: "Rs." + billData.netPayableAmount + " /- ", font: "Roboto", fontSize: 8.5 },
                          { text: "(" + billData.netPayableAmountWords + ")", font: "Roboto", fontSize: 8.5 },
                        ],
                        lineHeight: 1.25,
                        alignment: "left",
                        colSpan: 2,
                        border: ALLBORDER,
                        margin: [5, 5, 5, 5],
                      },
                      {},
                    ],
                    [
                      {
                        stack: [
                          { text: "स्वाक्षरी", font: "NotoDevanagari", fontSize: 8.5, margin: [0, 0, 0, 3] },
                          { text: "नाम", font: "NotoDevanagari", fontSize: 8.5, margin: [0, 0, 0, 3] },
                          { text: "पदनाम", font: "NotoDevanagari", fontSize: 8.5, margin: [0, 0, 0, 3] },
                          { text: "\u0928\u093f\u092f\u0902\u0924\u094d\u0930\u0915 \u0905\u0927\u093f\u0915\u093e\u0930\u0940", font: "NotoDevanagari", fontSize: 8.5, margin: [0, 0, 0, 3] },
                          { text: "\u0926\u093f\u0928\u093e\u0902\u0915", font: "NotoDevanagari", fontSize: 8.5, margin: [0, 0, 0, 3] },
                          {
                            columns: [
                              { width: "*", text: "" },
                              { width: "auto", text: "\u0920\u093f\u0915\u093e\u0923", alignment: "right", font: "NotoDevanagari", fontSize: 8.5 },
                            ],
                            margin: [0, 2, 0, 0],
                          },
                        ],
                        border: ALLBORDER,
                        margin: [5, 5, 5, 5],
                      },
                      {
                        stack: [
                          { text: "स्वाक्षरी", font: "NotoDevanagari", fontSize: 8.5, margin: [0, 0, 0, 3] },
                          { text: "नाम", font: "NotoDevanagari", fontSize: 8.5, margin: [0, 0, 0, 3] },
                          {
                            text: [
                              { text: "पदनाम ", bold: true, font: "NotoDevanagari", fontSize: 8.5 },
                              { text: billData.officeDetails || "", font: "Roboto", fontSize: 8 },
                            ],
                            margin: [0, 0, 0, 3],
                          },
                          { text: "आहरण व सिवतरण अिधकारी", font: "NotoDevanagari", fontSize: 8.5 },
                        ],
                        border: ALLBORDER,
                        margin: [5, 5, 5, 5],
                      },
                    ],
                  ],
                },
                margin: [28, 0, 28, 15],
              },

              // Treasury Section
              {
                text: "-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------",
                font: "Roboto",
                margin: [28, 0, 28, 5],
              },
              {
                text: "For use of Treasury/Sub Treasury/Pay & Account Office.",
                bold: true,
                fontSize: 9,
                font: "Roboto",
                alignment: "center",
                margin: [28, 0, 28, 10],
              },
              {
                text: "Pay Rs. __________________________________________ /- (In Words) Rupees",
                fontSize: 8.5,
                font: "Roboto",
                margin: [28, 0, 28, 5],
              },
              {
                text: "Pay By Transfer Credit Rs. _________________________ /- to _________________________ (Scheme Code)",
                fontSize: 8.5,
                font: "Roboto",
                margin: [28, 0, 28, 5],
              },
              {
                text: "Auditor _________________________ Supervisor _________________________      STO/ATO/TO/APAO _________________________",
                fontSize: 8.5,
                font: "Roboto",
                margin: [28, 0, 28, 5],
              },
              {
                text: "Cheque/e-Payment _________________________ Date ________________________       Cheque/e-Payment Advice Slip",
                fontSize: 8.5,
                font: "Roboto",
                margin: [28, 0, 28, 5],
              },
              {
                text: "Payment Advice No. _________________________                Delivered on Date ________________________",
                fontSize: 8.5,
                font: "Roboto",
                margin: [28, 0, 28, 5],
              },
              {
                text: "STO/ATO/TO/APAO _________________________              Delivery Cleark _________________________",
                fontSize: 8.5,
                font: "Roboto",
                margin: [28, 0, 28, 15],
              },

              // Audit Office Section
              {
                text: "-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------",
                font: "Roboto",
                margin: [28, 0, 28, 5],
              },
              {
                text: "For Use of Audit Office.",
                bold: true,
                fontSize: 9,
                font: "Roboto",
                alignment: "center",
                margin: [28, 0, 28, 10],
              },
              {
                columns: [
                  { width: "auto", text: "Admitted For Rs. ______________ /-", fontSize: 8.5, font: "Roboto", margin: [28, 0, 30, 0] },
                  { width: "auto", text: "Objected For Rs. ______________ /-", fontSize: 8.5, font: "Roboto", margin: [0, 0, 28, 0] },
                ],
                margin: [0, 0, 0, 5],
              },
              {
                columns: [{ width: "*", text: "Reason for Objection. _________________________", fontSize: 8.5, font: "Roboto", margin: [28, 0, 28, 5] }],
                margin: [0, 0, 0, 5],
              },
              {
                columns: [
                  { width: "auto", text: "Auditor", fontSize: 8.5, font: "Roboto", margin: [28, 0, 30, 0] },
                  { width: "auto", text: "Section Officer", fontSize: 8.5, font: "Roboto", margin: [0, 0, 30, 0] },
                  { width: "*", text: "Accounts Officer", fontSize: 8.5, font: "Roboto", margin: [0, 0, 28, 0] },
                ],
                margin: [0, 0, 0, 0],
              },
            ],
          },

          // ==================== PAGE 3 ====================
          {
            pageBreak: "before",
            margin: [0, 0, 0, 0],
            stack: [
              {
                columns: [
                  {
                    width: "20%",
                    alignment: "left",
                    stack: headerLogoLeftDataUrl ? [{ image: headerLogoLeftDataUrl, width: 80, height: 40, alignment: "center" }] : [],
                  },
                  {
                    width: "60%",
                    stack: [
                      {
                        text: "MahaDBT eScholarship",
                        bold: true,
                        fontSize: 16,
                        color: "#1a237e",
                        font: "Roboto",
                        alignment: "center",
                        margin: [0, 25, 0, 0],
                      },
                    ],
                  },
                  {
                    width: "20%",
                    alignment: "right",
                    stack: headerLogoRightDataUrl ? [{ image: headerLogoRightDataUrl, width: 80, height: 80, alignment: "center" }] : [],
                  },
                ],
                margin: [28, 0, 28, 5],
              },

              {
                canvas: [{ type: "line", x1: 28, y1: 0, x2: 567.28, y2: 0, lineWidth: 1, lineColor: "#000000" }],
                margin: [0, 0, 0, 15],
              },
              {
                columns: [
                  { width: "*", text: "Scheme Name: " + " Financial Year: " + billData.financialYear, fontSize: 11, bold: true, font: "Roboto", margin: [28, 0, 28, 10] },
                ],
              },

              {
                layout: "noBorders",
                table: {
                  widths: ["*", "*", "*"],
                  body: [
                    [
                      { text: "Bill No.: " + (billData.billNo || ""), fontSize: 9, bold: true, font: "Roboto", alignment: "left", margin: [28, 0, 0, 0] },
                      { text: "DDO Code: " + (billData.ddoCode || ""), fontSize: 9, bold: true, font: "Roboto", alignment: "center" },
                      { text: "Scheme Code: " + billData.schemeCode, fontSize: 9, bold: true, font: "Roboto", alignment: "right", margin: [0, 0, 28, 0] },
                    ],
                  ],
                },
                margin: [0, 0, 0, 20],
              },

              {
                text: billData.beneficiaryName + " is hereby sanctioned amount of: " + billData.totalDemandAmount,
                fontSize: 9,
                bold: true,
                font: "Roboto",
                margin: [28, 0, 28, 10],
              },

              {
                text: "Rupees " + billData.totalDemandAmountWords,
                fontSize: 9,
                bold: true,
                font: "Roboto",
                margin: [28, 0, 28, 15],
              },

              {
                text: "to the Colleges/Institutions as per statement enclosed here with for the year " + billData.financialYear + " towards the Payment of Students sanctioned by Principal of respective college/ " + (billData.beneficiaryName || "") + " G.R. below",
                fontSize: 9.5,
                lineHeight: 1.3,
                font: "Roboto",
                margin: [28, 0, 28, 20],
              },

              {
                layout: {
                  hLineWidth: (i, node) => i === 0 || i === node.table.body.length ? 1 : 0.5,
                  vLineWidth: (i, node) => i === 0 || i === node.table.widths.length ? 1 : 0.5,
                  hLineColor: () => "#000000",
                  vLineColor: () => "#000000",
                  paddingLeft: () => 8,
                  paddingRight: () => 8,
                  paddingTop: () => 6,
                  paddingBottom: () => 6,
                },
                table: {
                  widths: ["*", "30%"],
                  body: [
                    [
                      { text: "Gross amount of -", fontSize: 9.5, bold: true, font: "Roboto", margin: [28, 0, 0, 0] },
                      { text: formatAmountIndian(billData.grossAmount), fontSize: 9.5, alignment: "right", bold: true, font: "Roboto", margin: [0, 0, 28, 0] },
                    ],
                    [
                      { text: "Deduct Adhoc amount sanctioned during -CurrentFinancialYear-rentFinancialYear-", fontSize: 9.5, font: "Roboto", margin: [28, 0, 0, 0] },
                      { text: formatAmountIndian(billData.deductionAmount), fontSize: 9.5, alignment: "right", font: "Roboto", margin: [0, 0, 28, 0] },
                    ],
                    [
                      { text: "Net Amount now payable", fontSize: 9.5, bold: true, font: "Roboto", margin: [28, 0, 0, 0] },
                      { text: formatAmountIndian(billData.netPayableAmount), fontSize: 9.5, alignment: "right", bold: true, font: "Roboto", margin: [0, 0, 28, 0] },
                    ],
                  ],
                },
                margin: [0, 0, 0, 15],
              },

              {
                text: "Rupees " + billData.netPayableAmountWords,
                fontSize: 11,
                bold: true,
                alignment: "center",
                font: "Roboto",
                margin: [0, 0, 0, 15],
              },

              {
                text: "The amount of Scholarship is sanctioned subject to the Procedure, terms and conditions laid down in the said Govt Resolutions.",
                fontSize: 9.5,
                lineHeight: 1.3,
                font: "Roboto",
                margin: [28, 0, 28, 10],
              },

              {
                text: `The expenditure should be debited to the budget head : ${billData.financialYear}`,
                fontSize: 9.5,
                font: "Roboto",
                margin: [28, 0, 28, 20],
              },
              {
                text: mix([{ text: "Head of Account / ", mr: false, bold: true, size: 9.5 }, { text: "लेखािशषर्", mr: true, bold: true, size: 9.5 }]),
                lineHeight: 1.3,
                margin: [28, 0, 28, 10],
              },

              {
                layout: "noBorders",
                table: {
                  widths: ["40%", "60%"],
                  body: [
                    [mix([{ text: "Administrative Department / ", mr: false, bold: true, size: 9 }, { text: "प्रशासकीय िवभाग ", mr: true, bold: true, size: 9 }]), en(billData.adminDept || "", true, 9)],
                    [mix([{ text: "Demand No. / ", mr: false, bold: true, size: 9 }, { text: "मागणी क्रमांक", mr: true, bold: true, size: 9 }]), en(billData.demandNo || "", true, 9)],
                    [mix([{ text: "Sector / ", mr: false, bold: true, size: 9 }, { text: "क्षेत्र", mr: true, bold: true, size: 9 }]), en("", true, 9)],
                    [mix([{ text: "Sub Sector / ", mr: false, bold: true, size: 9 }, { text: "उप क्षेत्र", mr: true, bold: true, size: 9 }]), en("", true, 9)],
                    [mix([{ text: "Major Head / ", mr: false, bold: true, size: 9 }, { text: "\u092e\u0941\u0916\u094d\u092f \u0936\u093f\u0930\u094d\u0937", mr: true, bold: true, size: 9 }]), en(billData.majorHead || "", true, 9)],
                    [mix([{ text: "Minor Head / ", mr: false, bold: true, size: 9 }, { text: "\u0917\u094c\u0923 \u0936\u093f\u0930\u094d\u0937", mr: true, bold: true, size: 9 }]), en(billData.minorHead || "", true, 9)],
                    [mix([{ text: "Sub Head / ", mr: false, bold: true, size: 9 }, { text: "\u0909\u092a \u0936\u093f\u0930\u094d\u0937", mr: true, bold: true, size: 9 }]), en(billData.subHead || "", true, 9)],
                    [mix([{ text: "Detailed Head / ", mr: false, bold: true, size: 9 }, { text: "\u0924\u092a\u0936\u0940\u0932\u0935\u093e\u0930 \u0936\u093f\u0930\u094d\u0937", mr: true, bold: true, size: 9 }]), en(billData.detailHead || "", true, 9)],
                  ],
                },
                margin: [28, 0, 28, 20],
              },

              {
                text: "Copy To:",
                bold: true,
                fontSize: 10,
                font: "Roboto",
                margin: [28, 0, 28, 5],
              },
              {
                text: "• Pay & Accounts Office, Mumbai",
                fontSize: 9.5,
                font: "Roboto",
                margin: [38, 0, 28, 0],
              },
            ],
          },
        ],
      };

      // Generate and download PDF
      return dd;

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const buildPensionRFTPdfDefinition = async (rowData, billDataFromAPI, schemeName) => {
    console.log(rowData, "rowData");

    const schemeData = apiRes?.schemeData || {};

    // Get department name dynamically from schemeData
    const rawDepartmentValue = schemeData?.department;
    const departmentName = rawDepartmentValue
      ? (isNaN(Number(rawDepartmentValue))
        ? rawDepartmentValue
        : await getObjectName("departments", "id", rawDepartmentValue))
      : "Government Department";

    const totalAmount = Number(
      rowData?.allocatedAmount ||
      billDataFromAPI?.reduce((sum, item) => sum + (Number(item?.finalAmount) || 0), 0) ||
      0
    );
    const beneficiaryCount = Number(rowData?.beneficiaryCount || billDataFromAPI?.length || 0);
    let financialYear = rowData?.financialYear || apiRes?.selectedFinancialYear || apiRes?.financialYear || null;

    if (!financialYear) {
      const billDate = new Date(rowData?.dateCreated || new Date());
      const year = billDate.getFullYear();
      const month = billDate.getMonth() + 1;
      financialYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }

    const periodText = `Financial Year ${financialYear}`;

    const pensionLetterData = {
      departmentName: departmentName || "Department Name",
      letterNo: `RFT/${rowData?.billNumber || "NA"}`,
      date: formatDateLong(new Date()),
      period: periodText,
      designationAndDepartment: apiRes?.ddoRecord?.name || "Drawing and Disbursing Officer",
      amount: totalAmount,
      amountInWords: amountToWordsIndian(totalAmount),
      bankName: schemeData?.bankName || "State Bank of India",
      ifscCode: schemeData?.ifscCode || "SBIN0000454",
      accountNumber: schemeData?.accountNumber || "43862282553",
      schemeName: rowData?.schemeName || schemeData?.schemeName || rowData?.schemeCode || "Scheme Name",
      beneficiaryCount,
      beneficiaryCountInWords: numberToWordsIndian(beneficiaryCount),
    };

    const dd = {
      pageSize: "A4",
      pageMargins: [48, 56, 48, 56],
      defaultStyle: {
        font: "Roboto",
        fontSize: 11,
        lineHeight: 1.35,
      },
      content: [
        {
          text: "Government of Maharashtra",
          bold: true,
          fontSize: 16,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: `${pensionLetterData.departmentName}, Maharashtra`,
          bold: true,
          fontSize: 13,
          alignment: "center",
          margin: [0, 0, 0, 24],
        },
        {
          columns: [
            { width: "*", text: `Fund Transfer Request Number: ${pensionLetterData.letterNo}` },
          ],
          margin: [0, 0, 0, 12],
        },
        {
          text: `Date: ${pensionLetterData.date}`,
          margin: [0, 0, 0, 12],
        },
        {
          text: `For the period of ${pensionLetterData.period}`,
          margin: [0, 0, 0, 12],
        },
        {
          text:
            `${pensionLetterData.designationAndDepartment}, Government of Maharashtra, is hereby requested to release an amount of ` +
            `Rs. ${formatAmountIndian(pensionLetterData.amount)} (${pensionLetterData.amountInWords}) to the Bank ` +
            `${pensionLetterData.bankName} having IFSC Code ${pensionLetterData.ifscCode}, in Account Number ` +
            `${pensionLetterData.accountNumber}, for crediting the benefits under ${pensionLetterData.schemeName} in the beneficiary's account.`,
          margin: [0, 0, 0, 18],
          alignment: "justify",
        },
        {
          text:
            `Total number of beneficiaries included in this request is ${pensionLetterData.beneficiaryCount} ` +
            `(${pensionLetterData.beneficiaryCountInWords}).`,
          margin: [0, 0, 0, 10],
        },
        {
          text:
            `Total amount due to the beneficiaries is Rs. ${formatAmountIndian(pensionLetterData.amount)} ` +
            `(${pensionLetterData.amountInWords}).`,
          margin: [0, 0, 0, 18],
        },
        {
          text:
            "It is certified that the details of beneficiaries included in this request have been verified and found to be correct.",
          alignment: "justify",
          margin: [0, 0, 0, 42],
        },
      ],
    };

    return dd;
  };

  const handleDownloadLetter = async (rowData) => {
    try {
      if (rowData?.beamsPdfUrl) {
        window.open(rowData.beamsPdfUrl, '_blank');
        return;
      }

      // For regular DDO — generate and download PDF directly without signing
      if (!isPensionRole) {
        setGeneratingBillId(rowData.id);
        try {
          const additionalData = await getDataBaseOnBillNumber(
            rowData.billNumber,
            apiRes.schemeData
          );

          // Fetch ddoschememapping using schemeCode
          let ddoMapping = {};
          let ddoMaster = {};
          if (rowData.schemeCode) {
            const mappingRes = await fetch(
              `/o/c/ddoschememappings?filter=${encodeURIComponent(`integrationSchemeCode eq '${rowData.schemeCode}'`)}&pageSize=1`,
              { headers: { "Accept": "application/json", "x-csrf-token": window.Liferay?.authToken || "" }, credentials: "include" }
            );
            const mappingData = await mappingRes.json();
            ddoMapping = mappingData?.items?.[0] || {};
          }

          // Fetch ddomaster using ddoCode
          if (rowData.ddoCode) {
            const ddoRes = await fetch(
              `/o/c/ddomasters?filter=${encodeURIComponent(`dDOCode eq '${rowData.ddoCode}'`)}&pageSize=1`,
              { headers: { "Accept": "application/json", "x-csrf-token": window.Liferay?.authToken || "" }, credentials: "include" }
            );
            const ddoData = await ddoRes.json();
            ddoMaster = ddoData?.items?.[0] || {};
          }

          // Build enriched beamsData from real sources
          const enrichedBeamsData = {
            ddoCode: rowData.ddoCode,
            authNo: ddoMapping.beamsSchemeCodeOLD || "",
            adminDept: ddoMapping.departmentCode || "",
            majorHead: "2235",
            minorHead: "200",
            subhead: "",
            detailHead: ddoMapping.detailHead || "",
            subDetailHead: "",
            schemeCode: ddoMapping.integrationSchemeCode || rowData.schemeCode,
            address: ddoMaster.dDOAddress || "",
            bankACName: ddoMapping.accountHolderName || "",
            bankName: ddoMapping.bankName || "",
            bankBranchName: ddoMapping.districtName || "",
            bankACNumber: ddoMapping.accountNumber || "",
            budgetYear1: new Date().getFullYear(),
            budgetYear2: new Date().getFullYear() + 1,
          };

          const resolveFinancialYear = () => {
            const fy = searchData?.financialYear;
            // If it's a 4-digit key like "2526", convert to "2025-2026"
            if (fy && /^\d{4}$/.test(fy)) {
              const startYear = 2000 + parseInt(fy.substring(0, 2));
              const endYear = 2000 + parseInt(fy.substring(2, 4));
              return `${startYear}-${endYear}`;
            }
            // If it's already in correct format like "2025-2026", use as is
            if (fy && fy.includes('-')) return fy;
            // Fallback to bill creation date
            const billDate = new Date(rowData?.dateCreated || new Date());
            const year = billDate.getFullYear();
            const month = billDate.getMonth() + 1;
            return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
          };
          const financialYear = resolveFinancialYear();

          const enrichedRowData = {
            ...rowData,
            schemeName: ddoMapping.name || rowData.schemeCode,
            beamsPdfData: JSON.stringify(enrichedBeamsData),
            financialYear: financialYear
          };

          const dd = await buildGrantInAidPdfDefinition(enrichedRowData, additionalData);
          pdfMake.vfs = pdfMakeVfs;
          pdfMake.fonts = {
            Roboto: {
              normal: 'Roboto-Regular.ttf',
              bold: 'Roboto-Medium.ttf',
              italics: 'Roboto-Italic.ttf',
              bolditalics: 'Roboto-MediumItalic.ttf',
            },
            NotoDevanagari: {
              normal: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/master/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
              bold: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/master/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Bold.ttf',
              italics: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
              bolditalics: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Bold.ttf',
            }
          };
          pdfMake.createPdf(dd).download(`Grant_in_Aid_Bill_${rowData.billNumber}.pdf`);
        } finally {
          setGeneratingBillId(null);
        }
        return;
      }

      alert('Signed letter is not available yet. Please submit the bill first.');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download letter.');
      setGeneratingBillId(null);
    }
  };

  const preparePdfForSigning = async (rowData) => {
    console.log("preparePdfForSigning called");
    try {
      setGeneratingBillId(rowData.id);

      let additionalData = [];
      if (!isPensionRole) {
        additionalData = await getDataBaseOnBillNumber(
          rowData.billNumber,
          apiRes.schemeData
        );
      }

      if (isPensionRole) {
        const doc = new jsPDF();

        const totalAmount = Number(rowData?.allocatedAmount || 0);
        const beneficiaryCount = Number(rowData?.beneficiaryCount || 0);

        const resolveFinancialYear = () => {
          const fy = searchData?.financialYear;
          // If it's a 4-digit key like "2526", convert to "2025-2026"
          if (fy && /^\d{4}$/.test(fy)) {
            const startYear = 2000 + parseInt(fy.substring(0, 2));
            const endYear = 2000 + parseInt(fy.substring(2, 4));
            return `${startYear}-${endYear}`;
          }
          // If it's already in correct format like "2025-2026", use as is
          if (fy && fy.includes('-')) return fy;
          // Fallback to bill creation date
          const billDate = new Date(rowData?.dateCreated || new Date());
          const year = billDate.getFullYear();
          const month = billDate.getMonth() + 1;
          return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        };
        const financialYear = resolveFinancialYear();

        const rawDepartmentValue = apiRes?.schemeData?.department;

        let departmentName = "Government Department";

        if (rawDepartmentValue) {
          if (isNaN(Number(rawDepartmentValue))) {
            departmentName = rawDepartmentValue;
          } else {
            departmentName = await getObjectName("departments", "id", rawDepartmentValue);
          }
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Government of Maharashtra', 105, 20, { align: 'center' });

        doc.setFontSize(13);
        doc.text(`${departmentName}, Maharashtra`, 105, 30, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fund Transfer Request Number: RFT/${rowData?.billNumber || 'NA'}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 20, 60);
        doc.text(`Financial Year: ${financialYear}`, 20, 70);

        const bodyText = `Drawing and Disbursing Officer, Government of Maharashtra, is hereby requested to release an amount of Rs. ${totalAmount.toLocaleString('en-IN')} to the Bank State Bank of India having IFSC Code SBIN0000454, in Account Number 43862282553, for crediting the benefits under ${rowData?.schemeName || 'Scheme'} in the beneficiary's account.`;
        const splitBody = doc.splitTextToSize(bodyText, 170);
        doc.text(splitBody, 20, 85);

        doc.text(`Total number of beneficiaries: ${beneficiaryCount}`, 20, 130);
        doc.text(`Total amount: Rs. ${totalAmount.toLocaleString('en-IN')} (${amountToWordsIndian(totalAmount)})`, 20, 140);
        doc.text('It is certified that the details of beneficiaries have been verified and found to be correct.', 20, 155, { maxWidth: 170 });

        const base64 = doc.output('datauristring').split(',')[1];
        const fileName = `RFT_${rowData.billNumber}.pdf`;

        setPendingRowData(rowData);
        setPendingBase64Pdf(base64);
        setPendingFileName(fileName);
        setGeneratingBillId(null);
        setShowPasswordModal(true);
      } else {
        const dd = await buildGrantInAidPdfDefinition(rowData, additionalData);
        const fileName = `Bill_${rowData.billNumber}.pdf`;

        pdfMake.vfs = pdfMakeVfs;
        pdfMake.fonts = {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf',
          },
          NotoDevanagari: {
            normal: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/master/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
            bold: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/master/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Bold.ttf',
            italics: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
            bolditalics: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Bold.ttf',
          }
        };

        pdfMake.createPdf(dd).getDataUrl((dataUrl) => {
          const base64 = dataUrl.split(',')[1];

          setPendingRowData(rowData);
          setPendingBase64Pdf(base64);
          setPendingFileName(fileName);
          setGeneratingBillId(null);
          setShowPasswordModal(true);
        });
      }
    } catch (error) {
      console.error('Error preparing PDF for signing:', error);
      alert('Failed to prepare PDF for signing.');
      setGeneratingBillId(null);
    }
  };

  const base64ToBlob = (base64, contentType = "application/pdf") => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: contentType });
  };

  const generateRftOnly = async (rowData) => {
    try {
      setGeneratingBillId(rowData.id);

      if (isPensionRole) {
        const doc = new jsPDF();

        const totalAmount = Number(rowData?.allocatedAmount || 0);
        const beneficiaryCount = Number(rowData?.beneficiaryCount || 0);

        const resolveFinancialYear = () => {
          const fy = searchData?.financialYear;

          if (fy && /^\d{4}$/.test(fy)) {
            const startYear = 2000 + parseInt(fy.substring(0, 2), 10);
            const endYear = 2000 + parseInt(fy.substring(2, 4), 10);
            return `${startYear}-${endYear}`;
          }

          if (fy && fy.includes("-")) return fy;

          const billDate = new Date(rowData?.dateCreated || new Date());
          const year = billDate.getFullYear();
          const month = billDate.getMonth() + 1;
          return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        };

        const financialYear = resolveFinancialYear();

        const rawDepartmentValue = apiRes?.schemeData?.department;
        let departmentName = "Government Department";

        if (rawDepartmentValue) {
          if (isNaN(Number(rawDepartmentValue))) {
            departmentName = rawDepartmentValue;
          } else {
            departmentName = await getObjectName("departments", "id", rawDepartmentValue);
          }
        }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Government of Maharashtra", 105, 20, { align: "center" });

        doc.setFontSize(13);
        doc.text(`${departmentName}, Maharashtra`, 105, 30, { align: "center" });

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        doc.text(`Fund Transfer Request Number: RFT/${rowData?.billNumber || "NA"}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 20, 60);
        doc.text(`Financial Year: ${financialYear}`, 20, 70);

        const bodyText = `Drawing and Disbursing Officer, Government of Maharashtra, is hereby requested to release an amount of Rs. ${totalAmount.toLocaleString("en-IN")} to the Bank State Bank of India having IFSC Code SBIN0000454, in Account Number 43862282553, for crediting the benefits under ${rowData?.schemeName || "Scheme"} in the beneficiary's account.`;

        const splitBody = doc.splitTextToSize(bodyText, 170);
        doc.text(splitBody, 20, 85);

        doc.text(`Total number of beneficiaries: ${beneficiaryCount}`, 20, 130);
        doc.text(`Total amount: Rs. ${totalAmount.toLocaleString("en-IN")} (${amountToWordsIndian(totalAmount)})`, 20, 140);


        doc.text(
          "It is certified that the details of beneficiaries have been verified and found to be correct.",
          20,
          155,
          { maxWidth: 170 }
        );

        const pdfBlob = doc.output("blob");
        const fileName = `RFT_${rowData.billNumber}.pdf`;
        const siteId = window.Liferay?.ThemeDisplay?.getScopeGroupId();

        const formData = new FormData();
        formData.append("file", pdfBlob, fileName);
        formData.append("title", fileName);
        formData.append("description", `RFT generated for bill ${rowData?.billNumber || ""}`);

        const uploadRes = await fetch(
          `/o/headless-delivery/v1.0/sites/${siteId}/documents`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "x-csrf-token": window.Liferay?.authToken || "",
            },
            credentials: "include",
            body: formData,
          }
        );

        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          console.error("Upload failed:", uploadJson);
          throw new Error(uploadJson?.message || "Failed to upload RFT");
        }

        const fileEntryId = String(uploadJson?.id || "");
        const downloadUrl =
          uploadJson?.contentUrl ||
          uploadJson?.downloadURL ||
          uploadJson?.url ||
          "";

        const patchRes = await fetch(`/o/c/billmanagements/${rowData.id}`, {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-csrf-token": window.Liferay?.authToken || "",
          },
          credentials: "include",
          body: JSON.stringify({
            beamsPdfUrl: downloadUrl,
            beamsPdfId: fileEntryId,
            submittedStatus: "Completed"
          }),
        });

        if (!patchRes.ok) {
          const errText = await patchRes.text();
          console.error("Billmanagement patch failed:", errText);
          throw new Error("Failed to update billmanagement row");
        }

       const userId = window.Liferay.ThemeDisplay.getUserId();
       const refreshedBills = await getBills(userId);

        const mappedData = refreshedBills.map(item => ({
          ...item,
          beneficiaryAllocatedCount: Number(item.beneficiaryCount || 0),
          submittedBillStatus: item.submittedStatus,
          paymentAuthorizationLetter: item.paymentAuthLetter,
          mtr: item.mtrFile,
          beneficiaryListExport: item.beneficiaryExport,
          beams: item.beamsStatus
        }));

        setSubmittedBillList([]);
        setBillSubmitted(true);
        setResponseData(mappedData);
      } else {
        await preparePdfForSigning(rowData);
      }
    } catch (error) {
      console.error("generateRftOnly error:", error);
    } finally {
      setGeneratingBillId(null);
    }
  };

  const handlePasswordConfirm = async () => {
    const CORRECT_PASSWORD = 'chef$123';

    if (!pendingBase64Pdf || !pendingFileName || !pendingRowData) {
      setPasswordError('Missing PDF data. Please generate the PDF again.');
      return;
    }

    if (pfxPassword !== CORRECT_PASSWORD) {
      setPasswordError('Invalid password. Please try again.');
      return;
    }

    setShowPasswordModal(false);
    setGeneratingBillId(pendingRowData?.id);

    try {
      const res = await fetch('/o/mhdbt-headless-service/v1.0/pdf/sign', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-csrf-token': window.Liferay?.authToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          base64Pdf: pendingBase64Pdf,
          fileName: pendingFileName,
          password: pfxPassword,
          billId: pendingRowData?.id
        })
      });

      const signedRes = await res.json();

      if (!res.ok || !signedRes || signedRes.statusCode !== '200') {
        throw new Error(signedRes?.message || 'PDF upload/signing failed');
      }

      await fetch(`/o/c/billmanagements/${pendingRowData.id}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-csrf-token': window.Liferay?.authToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          beamsPdfUrl: signedRes.downloadUrl,
          beamsPdfId: signedRes.fileEntryId,
          submittedStatus: "Completed"
        })
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      const refreshBills = await getBills(loginUserId);
      const mappedData = refreshBills.map(item => ({
        ...item,
        beneficiaryAllocatedCount: Number(item.beneficiaryCount || 0),
        submittedBillStatus: item.submittedStatus,
        paymentAuthorizationLetter: item.paymentAuthLetter,
        mtr: item.mtrFile,
        beneficiaryListExport: item.beneficiaryExport,
        beams: item.beamsStatus
      }));
      setResponseData(mappedData);

      setSubmittedBillList([]);
      setBillSubmitted(true);

    } catch (error) {
      console.error('Error calling PDF sign API:', error);
      alert('Failed to upload/sign PDF. Please try again.');
    } finally {
      setGeneratingBillId(null);
      setPfxPassword('');
      setPasswordError('');
      setPendingRowData(null);
      setPendingBase64Pdf(null);
      setPendingFileName(null);
    }
  };

  console.log("responseData:::::::::::", responseData, submittedBillList)

  return (
    <>
      {tableData.length > 0 && (
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="d-flex align-items-center">
              <label className="me-2">Show entries:</label>
              <select
                className="form-select w-auto"
                value={entriesPerPageState}
                onChange={handleEntriesPerPageChange}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive" style={{ overflowX: 'auto' }}>
        <table className="table table-bordered table-striped table-hover" style={{ minWidth: '1400px' }}>
          <thead className="table-primary">
            <tr>
              <th>Bill Number</th>
              <th>Scheme Code</th>
              {!isPensionRole && <th>DDO Code</th>}
              <th>Beneficiary Allocated Count</th>
              <th>Allocated Amount</th>
              <th>Bill Generation Status</th>
              {!isPensionRole && <th>BEAMS</th>}
              <th>Cancel Bill</th>
              {!isPensionRole && <th>Payment Authorization Letter</th>}
              <th>Bill Covering Letter</th>
              <th>MTR</th>
              <th>Beneficiary List Export</th>
              <th>Covering Letter</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length > 0 ? (
              currentEntries.map((item, index) => (
                <tr key={index}>
                  <td className="fw-bold">{item.billNumber}</td>
                  <td>{apiRes?.ddoRecord?.integrationSchemeCode || item.schemeCode}</td>
                  {!isPensionRole && <td>{item.ddoCode}</td>}
                  <td className="text-center">{item.beneficiaryCount}</td>
                  <td className="text-end">{formatCurrency(item.allocatedAmount)}</td>
                  <td>
                    <span className="fw-bold">
                      {item.submittedStatus === "Pending" ? "Pending" : "Completed"}
                    </span>
                  </td>
                  {!isPensionRole && (
                    <td>
                      {item.submittedStatus === "Pending" && !item.beamsPdfUrl ? (
                        <button className="btn btn-sm btn-primary" onClick={() => handleSubmitBill(item)}>
                          Submit Bill
                        </button>
                      ) : ""}
                    </td>
                  )}
                  <td>
                    <button
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => handleCancelBill(item)}
                    >
                      Cancel
                    </button>
                  </td>
                  {!isPensionRole && (
                    <td className="text-center">
                      {item.beamsPdfUrl ? (
                        <a href={item.beamsPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" download>
                          Download
                        </a>
                      ) : "-"}
                    </td>
                  )}
                  <td className="text-center">
                    {item.submittedStatus !== "Pending" ? (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleDownloadLetter(item)}
                        disabled={generatingBillId === item.id}
                      >
                        {generatingBillId === item.id ? "Generating..." : "Download Letter"}
                      </button>
                    ) : "-"}
                  </td>
                  <td className="text-center">{item.mtr || "-"}</td>
                  <td className="text-center">{item.beneficiaryListExport || "-"}</td>
                  <td className="text-center">{item.coveringLetter || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isSnoRole ? 12 : 13} className="text-center">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {tableData.length > 0 && (
        <div className="row mt-3">
          <div className="col-md-6">
            <p>Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, tableData.length)} of {tableData.length} entries</p>
          </div>
          <div className="col-md-6">
            <nav>
              <ul className="pagination justify-content-end">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={prevPage}>Previous</button>
                </li>
                {pageNumbers.map(number => (
                  <li key={number} className={`page-item ${currentPage === number ? "active" : ""}`}>
                    <button onClick={() => paginate(number)} className="page-link">{number}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={nextPage}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {submittedBillList.length <= 0 && (
        <BillSubmission
          apiRes={apiRes}
          submittedBillList={submittedBillList}
          setResponseData={setResponseData}
          setSubmittedBillList={setSubmittedBillList}
          generateRftOnly={generateRftOnly}
          billRowData={tableData.find(item => item.billNumber === submittedBillList?.[0]?.batchID)}
        />
      )}
      {showPasswordModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#1a237e' }}>
                <h5 className="modal-title text-white fw-bold">Generate Digital Signature</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPfxPassword('');
                    setPasswordError('');
                  }}
                />
              </div>
              <div className="modal-body">
                <label className="form-label fw-bold">Enter password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={pfxPassword}
                    onChange={(e) => {
                      setPfxPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter password"
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {passwordError && (
                  <div className="text-danger mt-1 small">{passwordError}</div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPfxPassword('');
                    setPasswordError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: '#1a237e', borderColor: '#1a237e' }}
                  onClick={handlePasswordConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default APLBillManagementTable;
