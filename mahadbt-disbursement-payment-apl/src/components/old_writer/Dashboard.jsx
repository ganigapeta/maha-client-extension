import React, { useState } from 'react';
import { getBeneficiaryRegistered } from '../../old_writer_api/fetch_beneficiary_registered';
import { useNavigate } from 'react-router-dom';

const SCHEME_NAME = 'Rajshri Shahu Maharaj Senior Literary and Artist Honourarium Mandhan Scheme';

const dashboardCards = [
  {
    title: 'Total Beneficiary Registered',
    value: 0,
    background: '#fff1c9',
    border: '#f0d37b',
  },
  {
    title: 'Total RFTs Generated',
    value: 0,
    background: '#dff1ef',
    border: '#b7ddd8',
  },
  {
    title: 'Total Beneficiaries Payment Processed (PFMS Posting Done)',
    value: 0,
    background: '#e9f1ff',
    border: '#c6d8ff',
  },
  {
    title: 'Total Beneficiaries Payment Completed (Payment Success)',
    value: 0,
    background: '#e4f4df',
    border: '#c4e2b8',
  },
  {
    title: 'Total Beneficiaries Payment Failed',
    value: 0,
    background: '#fde6e6',
    border: '#f2c1c1',
  },
];

const monthOptions = [
  { label: '- Select Month-', value: '' },
  { label: 'Jan', value: 1 },
  { label: 'Feb', value: 2 },
  { label: 'Mar', value: 3 },
  { label: 'Apr', value: 4 },
  { label: 'May', value: 5 },
  { label: 'Jun', value: 6 },
  { label: 'Jul', value: 7 },
  { label: 'Aug', value: 8 },
  { label: 'Sep', value: 9 },
  { label: 'Oct', value: 10 },
  { label: 'Nov', value: 11 },
  { label: 'Dec', value: 12 },
];

const DEFAULT_PAGE_SIZE = 5;

const getDefaultFinancialYear = (date = new Date()) => {
  const currentYear = date.getFullYear();

  return `${currentYear - 1}-${currentYear}`;
};

const getFinancialYearOptions = (selectedFinancialYear) => {
  const options = [{ label: '---Select Financial Year---', value: '' }, { label: '2024-2025', value: '2024-2025' }];

  if (selectedFinancialYear) {
    options.push({
      label: selectedFinancialYear,
      value: selectedFinancialYear,
    });
  }

  return options;
};

function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const defaultFinancialYear = getDefaultFinancialYear(now);
  const defaultMonth = now.getMonth() + 1;

  const [cards, setCards] = useState(dashboardCards);
  const [summaryData, setSummaryData] = useState({
    totalBeneficiary: 0,
    totalAmount: 0,
    month: defaultMonth,
    financialYear: defaultFinancialYear,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [filters, setFilters] = useState({
    financialYear: defaultFinancialYear,
    month: defaultMonth,
    schemeName: SCHEME_NAME,
    action: '',
  });

  const financialYearOptions = getFinancialYearOptions(defaultFinancialYear);

  const getMonthLabel = (monthValue) =>
    monthOptions.find((month) => Number(month.value) === Number(monthValue))?.label || '-';

  const fetchCardsCount = async (activeFilters) => {
    if (!activeFilters.financialYear || !activeFilters.month) {
      return;
    }

    setIsLoading(true);

    try {
      const [, financialYearEnd] = activeFilters.financialYear.split('-');
      const payload = {
        monthFrom: Number(activeFilters.month),
        monthTo: Number(activeFilters.month),
        pageNumber: 1,
        pageSize: 5,
        transYear: Number(financialYearEnd),
      };

      const response = await getBeneficiaryRegistered(payload);
      const totalCount = Number(response?.totalCount) || 0;
      const totalAmount =
        Number(response?.totalAmountFormatted ?? response?.totalAmount) || 0;

      setCards((prevCards) =>
        prevCards.map((card) =>
          card.title === 'Total Beneficiary Registered'
            ? { ...card, value: totalCount }
            : card
        )
      );

      setSummaryData({
        totalBeneficiary: totalCount,
        totalAmount,
        month: Number(activeFilters.month),
        financialYear: activeFilters.financialYear,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProceed = async (event) => {
    event.preventDefault();
    await fetchCardsCount(filters);
    setHasAppliedFilters(true);
  };

  const handleCardClick = (title) => {
    if (title === 'Total Beneficiary Registered') {
      navigate('/beneficiary-list', {
        state: {
          totalBeneficiary: summaryData.totalBeneficiary,
          totalAmount: summaryData.totalAmount,
          month: summaryData.month,
          monthLabel: getMonthLabel(summaryData.month),
          financialYear: summaryData.financialYear,
          schemeName: filters.schemeName,
          transYear: Number(summaryData.financialYear.split('-')[1]),
          monthFrom: Number(summaryData.month),
          monthTo: Number(summaryData.month),
          pageSize: DEFAULT_PAGE_SIZE,
        },
      });
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0 fw-bold">Generate Request for Fund Transfer</h5>
        </div>

        <div className="card-body">
          <form onSubmit={handleProceed}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">
                  Financial Year <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={filters.financialYear}
                  onChange={(event) => handleFilterChange('financialYear', event.target.value)}
                >
                  {financialYearOptions.map((year) => (
                    <option key={year.label} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">
                  Month <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={filters.month}
                  onChange={(event) => handleFilterChange('month', event.target.value)}
                >
                  {monthOptions.map((month) => (
                    <option key={month.label} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">
                  Scheme Name <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={filters.schemeName}
                  onChange={(event) => handleFilterChange('schemeName', event.target.value)}
                >
                  <option value={SCHEME_NAME}>{SCHEME_NAME}</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">
                  Action <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={filters.action}
                  onChange={(event) => handleFilterChange('action', event.target.value)}
                >
                  <option value="">---Select Action---</option>
                  <option value="Generate Request For Fund Transfer">
                    Generate Request For Fund Transfer
                  </option>
                </select>
              </div>

              <div className="col-12 d-flex justify-content-md-end justify-content-center mt-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    isLoading ||
                    !filters.financialYear ||
                    !filters.month ||
                    !filters.schemeName ||
                    !filters.action
                  }
                  style={{ minWidth: '120px' }}
                >
                  Proceed
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {isLoading ? (
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ minHeight: '260px' }}
        >
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: '3rem', height: '3rem' }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#475569' }}>
            Loading dashboard data...
          </div>
        </div>
      ) : (
        hasAppliedFilters && (
          <div className="row">
            {cards.map((card) => (
              <div className="col-md-6 col-lg-4 col-xl mb-4" key={card.title}>
                <div
                  className="h-100"
                  style={{
                    backgroundColor: card.background,
                    border: `1px solid ${card.border}`,
                    borderRadius: '14px',
                    minHeight: '215px',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
                    padding: '28px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h5
                      style={{
                        fontSize: '18px',
                        fontWeight: 500,
                        color: '#1f2937',
                        marginBottom: '18px',
                        lineHeight: 1.45,
                        minHeight: '78px',
                      }}
                    >
                      {card.title}
                    </h5>

                    <div
                      style={{
                        fontSize: '44px',
                        fontWeight: 700,
                        lineHeight: 1,
                        color: '#111827',
                        marginBottom: '28px',
                      }}
                    >
                      {card.value}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark"
                      onClick={() => handleCardClick(card.title)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default Dashboard;
