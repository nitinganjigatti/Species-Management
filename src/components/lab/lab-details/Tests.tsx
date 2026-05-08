import {
  Box,
  Card,
  CardHeader,
  Divider,
  Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import type { TestsProps, LabSampleWithTests, LabChildTest, LabParentTest } from 'src/types/lab'

interface FlatTest {
  test_id: number
  test_name: string
  input_type?: string
}

const Tests = ({ labTest }: TestsProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<FlatTest[]>([])

  function extractTestsData(labTest: LabSampleWithTests[]): FlatTest[] {
    const parent = labTest.flatMap(lab =>
      lab.tests.flatMap((test: LabParentTest) =>
        test.child_tests.map((childTest: LabChildTest) => ({
          test_id: childTest.test_id,
          test_name: childTest.test_name,
          input_type: childTest.input_type
        }))
      )
    )

    const child = labTest.flatMap(lab => lab.tests.map((test: LabParentTest) => ({ test_id: test.test_id, test_name: test.test_name })))

    let newArray = [...parent, ...child]

    newArray.sort((a, b) => a.test_name.localeCompare(b.test_name))

    return newArray
  }

  useEffect(() => {
    if (labTest) {
      const extractedTestsData = extractTestsData(labTest)
      setRows(extractedTestsData)
    }
  }, [labTest])

  return (
    <Card>
      <CardHeader title={t('lab_module.tests')} />
      <Box sx={{ px: 5, mb: 5 }}>
        {labTest?.map((list, index) => (
          <Box key={index} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 'bold', m: 2, textTransform: 'capitalize' }}>
              {list?.sample_name}
            </Typography>
            {list?.tests?.map((parent, index) =>
              parent?.child_tests?.length > 0 ? (
                <Box key={index}>
                  <Box
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgPrimary,
                      borderRadius: '4px',
                      p: 1,
                      mb: 1
                    }}
                  >
                    <Typography
                      sx={{
                        ml: 4,
                        display: 'flex',
                        py: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    >
                      {parent?.test_name}
                    </Typography>
                    <Divider />
                    {parent?.child_tests?.map(child => {
                      return (
                        <Typography
                          key={child?.test_id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            ml: 4,
                            py: 2,
                            textTransform: 'capitalize'
                          }}
                        >
                          {child?.test_name}
                        </Typography>
                      )
                    })}
                  </Box>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      bgcolor: theme.palette.customColors.displaybgPrimary,
                      borderRadius: '4px',
                      p: 1,
                      mb: 1
                    }}
                  >
                    <Typography
                      sx={{
                        ml: 4,
                        display: 'flex',
                        py: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    >
                      {parent?.test_name}
                    </Typography>
                  </Box>
                </>
              )
            )}
          </Box>
        ))}
      </Box>
    </Card>
  )
}

export default Tests
