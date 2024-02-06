const TestSample = [
  {
    sample_id: '1',
    sample_name: 'Whole Blood',
    value: false,
    tests: [
      {
        test_id: 5,
        full_test: false,
        test_name: 'Urinalysis',
        input_type: 'CheckBox',
        child_tests: []
      },
      {
        test_id: 11,
        full_test: false,
        test_name: 'Blood Tests',
        child_tests: [
          {
            value: false,
            test_id: 12,
            test_name: 'Coombs Test (for autoimmune hemolytic anemia)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 13,
            test_name: 'Crossmatching (for blood transfusions)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 14,
            test_name: 'Blood Typing',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 15,
            test_name: 'Blood Gas Analysis',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 16,
            test_name: 'Complete Blood Count (CBC)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 17,
            test_name: 'Blood Chemistry Panel',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 18,
            test_name: 'Coagulation Profile',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 19,
        full_test: false,
        test_name: 'Renal Function Tests',
        child_tests: [
          {
            value: false,
            test_id: 20,
            test_name: 'Glomerular Filtration Rate (GFR) Measurement',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 21,
        full_test: false,
        test_name: 'Reproductive Tests',
        child_tests: [
          {
            value: false,
            test_id: 22,
            test_name: 'Estrous Cycle Monitoring',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 23,
            test_name: 'Semen Analysis',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 24,
        full_test: false,
        test_name: 'Immunological Tests',
        child_tests: [
          {
            value: false,
            test_id: 25,
            test_name: 'Flow Cytometry',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 26,
            test_name: 'Lymphocyte Proliferation Assay',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 27,
        full_test: false,
        test_name: 'Serology',
        child_tests: [
          {
            value: false,
            test_id: 28,
            test_name: 'Enzyme-Linked Immunosorbent Assay (ELISA)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 29,
            test_name: 'Western Blotting',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 30,
        full_test: false,
        test_name: 'Endoscopy',
        child_tests: [
          {
            value: false,
            test_id: 31,
            test_name: 'Colonoscopy',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 32,
            test_name: 'Rhinoscopy',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 33,
            test_name: 'Laparoscopy',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 1,
        full_test: false,
        test_name: 'Toxicology Tests',
        child_tests: [
          {
            value: false,
            test_id: 2,
            test_name: 'Heavy Metal Testing',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 3,
            test_name: 'Drug Screening',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 4,
            test_name: 'Pesticide Residue Analysis',
            input_type: 'CheckBox'
          }
        ]
      }
    ]
  },
  {
    sample_id: '2',
    sample_name: 'Serum',
    value: false,
    tests: [
      {
        test_id: 63,
        full_test: false,
        test_name: 'Reproductive Tests',
        child_tests: [
          {
            value: false,
            test_id: 64,
            test_name: 'Estrous Cycle Monitoring',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 65,
            test_name: 'Semen Analysis',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 61,
        full_test: false,
        test_name: 'Molecular Biology Tests',
        child_tests: [
          {
            value: false,
            test_id: 62,
            test_name: 'RNA Sequencing',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 58,
        full_test: false,
        test_name: 'Cardiac Tests',
        child_tests: [
          {
            value: false,
            test_id: 59,
            test_name: 'Holter Monitoring',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 60,
            test_name: 'Cardiac Troponin Test',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 55,
        full_test: false,
        test_name: 'Cytology',
        child_tests: [
          {
            value: false,
            test_id: 56,
            test_name: 'Fine Needle Aspiration (FNA)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 57,
            test_name: 'Bronchoalveolar Lavage (BAL)',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 48,
        full_test: false,
        test_name: 'Neurological Tests',
        child_tests: [
          {
            value: false,
            test_id: 49,
            test_name: 'Electroencephalogram (EEG)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 50,
            test_name: 'Magnetic Resonance Imaging (MRI)',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 44,
        full_test: false,
        test_name: 'Parasitological Tests',
        child_tests: [
          {
            value: false,
            test_id: 45,
            test_name: 'Giardia Antigen Test',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 46,
            test_name: 'Babesia Test',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 47,
            test_name: 'Leishmania Test',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 42,
        full_test: false,
        test_name: 'Bone and Joint Tests',
        child_tests: [
          {
            value: false,
            test_id: 43,
            test_name: 'Dual-Energy X-ray Absorptiometry (DEXA) Scan',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 51,
        full_test: false,
        test_name: 'Genetic Tests',
        child_tests: [
          {
            value: false,
            test_id: 52,
            test_name: 'DNA Profiling',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 53,
            test_name: 'Genetic Disease Screening',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 54,
            test_name: 'Genetic Ancestry Testing',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 34,
        full_test: false,
        test_name: 'Imaging',
        child_tests: [
          {
            value: false,
            test_id: 35,
            test_name: 'Fluoroscopy',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 36,
            test_name: 'Positron Emission Tomography (PET)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 37,
            test_name: 'Nuclear Scintigraphy',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 38,
            test_name: 'Thermography',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 39,
            test_name: 'Myelography',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 40,
        full_test: false,
        test_name: 'Molecular Biology Tests',
        child_tests: [
          {
            value: false,
            test_id: 41,
            test_name: 'RNA Sequencing',
            input_type: 'CheckBox'
          }
        ]
      }
    ]
  },
  {
    sample_id: '3',
    sample_name: 'RRRR',
    value: false,
    tests: [
      {
        test_id: 106,
        full_test: false,
        test_name: 'Serology',
        child_tests: [
          {
            value: false,
            test_id: 107,
            test_name: 'Enzyme-Linked Immunosorbent Assay (ELISA)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 108,
            test_name: 'Western Blotting',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 103,
        full_test: false,
        test_name: 'Allergy Testing',
        child_tests: [
          {
            value: false,
            test_id: 104,
            test_name: 'Intradermal Skin Testing',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 105,
            test_name: 'Serum Allergy Testing (Serology)',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 101,
        full_test: false,
        test_name: 'Bone and Joint Tests',
        child_tests: [
          {
            value: false,
            test_id: 102,
            test_name: 'Dual-Energy X-ray Absorptiometry (DEXA) Scan',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 97,
        full_test: false,
        test_name: 'Hormone Assays',
        child_tests: [
          {
            value: false,
            test_id: 98,
            test_name: 'Thyroid Function Tests',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 99,
            test_name: 'Adrenal Function Tests',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 100,
            test_name: 'Sex Hormone Assays',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 93,
        full_test: false,
        test_name: 'Toxicology Tests',
        child_tests: [
          {
            value: false,
            test_id: 94,
            test_name: 'Heavy Metal Testing',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 95,
            test_name: 'Drug Screening',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 96,
            test_name: 'Pesticide Residue Analysis',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 91,
        full_test: false,
        test_name: 'Renal Function Tests',
        child_tests: [
          {
            value: false,
            test_id: 92,
            test_name: 'Glomerular Filtration Rate (GFR) Measurement',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 88,
        full_test: false,
        test_name: 'Cardiac Tests',
        child_tests: [
          {
            value: false,
            test_id: 89,
            test_name: 'Holter Monitoring',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 90,
            test_name: 'Cardiac Troponin Test',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 85,
        full_test: false,
        test_name: 'Immunological Tests',
        child_tests: [
          {
            value: false,
            test_id: 86,
            test_name: 'Flow Cytometry',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 87,
            test_name: 'Lymphocyte Proliferation Assay',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 82,
        full_test: false,
        test_name: 'Neurological Tests',
        child_tests: [
          {
            value: false,
            test_id: 83,
            test_name: 'Electroencephalogram (EEG)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 84,
            test_name: 'Magnetic Resonance Imaging (MRI)',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 77,
        full_test: false,
        test_name: 'Microbiological Tests',
        child_tests: [
          {
            value: false,
            test_id: 78,
            test_name: 'Polymerase Chain Reaction (PCR) Testing',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 79,
            test_name: 'Fecal Egg Count (for parasites)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 80,
            test_name: 'Mycoplasma Culture',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 81,
            test_name: 'Bacterial Sensitivity Testing',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 74,
        full_test: false,
        test_name: 'Cytology',
        child_tests: [
          {
            value: false,
            test_id: 75,
            test_name: 'Fine Needle Aspiration (FNA)',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 76,
            test_name: 'Bronchoalveolar Lavage (BAL)',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 70,
        full_test: false,
        test_name: 'Hormone Assays',
        child_tests: [
          {
            value: false,
            test_id: 71,
            test_name: 'Thyroid Function Tests',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 72,
            test_name: 'Adrenal Function Tests',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 73,
            test_name: 'Sex Hormone Assays',
            input_type: 'CheckBox'
          }
        ]
      },
      {
        test_id: 66,
        full_test: false,
        test_name: 'Parasitological Tests',
        child_tests: [
          {
            value: false,
            test_id: 67,
            test_name: 'Giardia Antigen Test',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 68,
            test_name: 'Babesia Test',
            input_type: 'CheckBox'
          },
          {
            value: false,
            test_id: 69,
            test_name: 'Leishmania Test',
            input_type: 'CheckBox'
          }
        ]
      }
    ]
  }
]

export default TestSample
