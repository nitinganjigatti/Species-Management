import MedicalRecords from 'src/components/medical/medicalRecords/MedicalRecord'
import enforceModuleAccess from 'src/components/ProtectedRoute'

export default enforceModuleAccess(MedicalRecords, 'medical_records')
