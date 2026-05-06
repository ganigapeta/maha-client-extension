 // Months
  export const getMonths = () => {
    return {
      data: [
        { id: 1, month_name: "January", month_number: 1 },
        { id: 2, month_name: "February", month_number: 2 },
        { id: 3, month_name: "March", month_number: 3 },
        { id: 4, month_name: "April", month_number: 4 },
        { id: 5, month_name: "May", month_number: 5 },
        { id: 6, month_name: "June", month_number: 6 },
        { id: 7, month_name: "July", month_number: 7 },
        { id: 8, month_name: "August", month_number: 8 },
        { id: 9, month_name: "September", month_number: 9 },
        { id: 10, month_name: "October", month_number: 10 },
        { id: 11, month_name: "November", month_number: 11 },
        { id: 12, month_name: "December", month_number: 12 },
      ],
    };
  };

  // Financial year month order (April to March)
  const financialYearMonthOrder = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  // Get current financial year and month
  const getCurrentFinancialYearAndMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Financial year starts in April (month 3)
    let fyStartYear, fyEndYear;
    if (currentMonth >= 3) { // April to December
      fyStartYear = currentYear;
      fyEndYear = currentYear + 1;
    } else { // January to March
      fyStartYear = currentYear - 1;
      fyEndYear = currentYear;
    }
    
    const currentFY = `${fyStartYear}-${fyEndYear}`;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthName = monthNames[currentMonth];
    
    return { currentFY, currentMonthName };
  };

  // Filter months based on selected financial year
  export const getFilteredMonths = (formData) => {
    if (!formData.financialYear) return [];
    
    const { currentFY, currentMonthName } = getCurrentFinancialYearAndMonth();
    
    // Order months in financial year sequence
    const orderedMonths = getMonths().data
      .sort((a, b) => {
        const indexA = financialYearMonthOrder.indexOf(a.month_name);
        const indexB = financialYearMonthOrder.indexOf(b.month_name);
        return indexA - indexB;
      });
    
    // If selected year is current financial year, filter up to current month
    if (formData.financialYear === currentFY) {
      const currentMonthIndex = financialYearMonthOrder.indexOf(currentMonthName);
      return orderedMonths.filter(month => {
        const monthIndex = financialYearMonthOrder.indexOf(month.month_name);
        // return monthIndex <= currentMonthIndex;
        return monthIndex < currentMonthIndex; // Changed <= to avoid current month

      });
    }
    
    // For past financial years, show all months
    return orderedMonths;
  };
