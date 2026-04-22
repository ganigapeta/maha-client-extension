/**
 * mockData.js
 * ─────────────────────────────────────────────────────────────
 * Mock data for the School Master Registration Form.
 * Used when useMockData={true} or when Liferay APIs are unreachable.
 *
 * All data shapes mirror the real Liferay REST API responses exactly,
 * so switching from mock → real requires zero changes in the component.
 *
 * Shape conventions:
 *   Dropdown item  : { id: string, name: string }
 *   Keyed map      : { [parentId]: [{ id, name }] }
 * ─────────────────────────────────────────────────────────────
 */


  export const MOCK_STATES = [
   { id: '1', value: 'MH', name: 'Maharashtra' },
   { id: '2', value: 'GJ', name: 'Gujarat' },
   // ...
];


// ─── Districts ───────────────────────────────────────────────
export const MOCK_DISTRICTS = [
  { id: '1',  name: 'Yavatmal'  },
  { id: '2',  name: 'Nagpur'    },
  { id: '3',  name: 'Amravati'  },
  { id: '4',  name: 'Nandurbar' },
  { id: '5',  name: 'Nashik'    },
  { id: '6',  name: 'Pune'      },
  { id: '7',  name: 'Thane'     },
  { id: '8',  name: 'Raigad'    },
];

// ─── Talukas  (keyed by districtId) ─────────────────────────
export const MOCK_TALUKAS = {
  '1': [
    { id: '101', name: 'Pusad'    },
    { id: '102', name: 'Wani'     },
    { id: '103', name: 'Yavatmal' },
    { id: '104', name: 'Ner'      },
    { id: '105', name: 'Digras'   },
  ],
  '2': [
    { id: '201', name: 'Nagpur (Rural)' },
    { id: '202', name: 'Kamthi'         },
    { id: '203', name: 'Hingna'         },
    { id: '204', name: 'Umred'          },
  ],
  '3': [
    { id: '301', name: 'Amravati'  },
    { id: '302', name: 'Achalpur' },
    { id: '303', name: 'Daryapur' },
    { id: '304', name: 'Morshi'   },
  ],
  '4': [
    { id: '401', name: 'Nandurbar' },
    { id: '402', name: 'Shahada'   },
    { id: '403', name: 'Taloda'    },
    { id: '404', name: 'Nawapur'   },
  ],
  '5': [
    { id: '501', name: 'Nashik'   },
    { id: '502', name: 'Igatpuri' },
    { id: '503', name: 'Surgana'  },
    { id: '504', name: 'Peint'    },
  ],
  '6': [
    { id: '601', name: 'Pune City' },
    { id: '602', name: 'Haveli'    },
    { id: '603', name: 'Maval'     },
    { id: '604', name: 'Velhe'     },
  ],
  '7': [
    { id: '701', name: 'Thane'       },
    { id: '702', name: 'Shahapur'    },
    { id: '703', name: 'Murbad'      },
    { id: '704', name: 'Jawhar'      },
  ],
  '8': [
    { id: '801', name: 'Alibag'    },
    { id: '802', name: 'Karjat'    },
    { id: '803', name: 'Khalapur'  },
    { id: '804', name: 'Mahad'     },
  ],
};

// ─── Villages  (keyed by talukaId) ──────────────────────────
export const MOCK_VILLAGES = {
  '101': [
    { id: '10101', name: 'Pusad Village'    },
    { id: '10102', name: 'Manora'           },
    { id: '10103', name: 'Loni Takli'       },
  ],
  '102': [
    { id: '10201', name: 'Wani Town'        },
    { id: '10202', name: 'Borlakhed'        },
    { id: '10203', name: 'Umri'             },
  ],
  '103': [
    { id: '10301', name: 'Yavatmal City'    },
    { id: '10302', name: 'Babhulgaon'       },
  ],
  '104': [
    { id: '10401', name: 'Ner Town'         },
    { id: '10402', name: 'Karanji'          },
  ],
  '105': [
    { id: '10501', name: 'Digras Town'      },
    { id: '10502', name: 'Pophali'          },
  ],
  '201': [
    { id: '20101', name: 'Butibori'         },
    { id: '20102', name: 'Khapri'           },
    { id: '20103', name: 'Kondhali'         },
  ],
  '202': [
    { id: '20201', name: 'Kamthi Town'      },
    { id: '20202', name: 'Godhani'          },
  ],
  '203': [
    { id: '20301', name: 'Hingna Town'      },
    { id: '20302', name: 'Kalmeshwar'       },
  ],
  '204': [
    { id: '20401', name: 'Umred Town'       },
    { id: '20402', name: 'Jalkheda'         },
  ],
  '301': [
    { id: '30101', name: 'Amravati City'    },
    { id: '30102', name: 'Nandgaon Khandeshwar' },
  ],
  '302': [
    { id: '30201', name: 'Achalpur Town'    },
    { id: '30202', name: 'Chandur Bazar'    },
  ],
  '401': [
    { id: '40101', name: 'Nandurbar City'   },
    { id: '40102', name: 'Molgi'            },
  ],
  '402': [
    { id: '40201', name: 'Shahada Town'     },
    { id: '40202', name: 'Navapur'          },
  ],
  '501': [
    { id: '50101', name: 'Nashik City'      },
    { id: '50102', name: 'Sinnar'           },
  ],
  '502': [
    { id: '50201', name: 'Igatpuri Town'    },
    { id: '50202', name: 'Ghoti'            },
  ],
  '601': [
    { id: '60101', name: 'Pune City'        },
    { id: '60102', name: 'Khadki'           },
  ],
  '602': [
    { id: '60201', name: 'Hadapsar'         },
    { id: '60202', name: 'Lohegaon'         },
  ],
  '701': [
    { id: '70101', name: 'Thane City'       },
    { id: '70102', name: 'Kopri'            },
  ],
  '702': [
    { id: '70201', name: 'Shahapur Town'    },
    { id: '70202', name: 'Asangaon'         },
  ],
  '801': [
    { id: '80101', name: 'Alibag Town'      },
    { id: '80102', name: 'Rewas'            },
  ],
  '802': [
    { id: '80201', name: 'Karjat Town'      },
    { id: '80202', name: 'Palasdhari'       },
  ],
};

// ─── PO Names (Post Offices) ─────────────────────────────────
export const MOCK_PO_NAMES = [
  { id: 'po1',  name: 'Pusad'      },
  { id: 'po2',  name: 'Yavatmal'   },
  { id: 'po3',  name: 'Nagpur'     },
  { id: 'po4',  name: 'Amravati'   },
  { id: 'po5',  name: 'Nandurbar'  },
  { id: 'po6',  name: 'Nashik'     },
  { id: 'po7',  name: 'Pune'       },
  { id: 'po8',  name: 'Thane'      },
  { id: 'po9',  name: 'Alibag'     },
  { id: 'po10', name: 'Wani'       },
  { id: 'po11', name: 'Shahada'    },
  { id: 'po12', name: 'Achalpur'   },
];

// ─── Simulated API delay (ms) ────────────────────────────────
export const MOCK_API_DELAY = 600;

/**
 * Simulates a delayed API response using mock data.
 * @param {any} data  – The mock data to return
 * @param {number} [delay] – Override delay in ms
 * @returns {Promise<any>}
 */
export async function simulateMockAPI(data, delay = MOCK_API_DELAY) {
  return new Promise((resolve) =>
    setTimeout(() => resolve(Array.isArray(data) ? [...data] : { ...data }), delay)
  );
}
