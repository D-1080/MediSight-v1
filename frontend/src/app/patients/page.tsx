'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, Users, Plus, Search, Edit, Trash2, Eye, X, Download } from 'lucide-react';import { patientService } from '@/lib/services';
import { Patient, PatientList } from '@/types';
import { exportPatientsToCSV } from '@/lib/csvService';
import Link from 'next/link';

export default function PatientsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const [patients, setPatients] = useState<PatientList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<{
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  email: string;
  phone: string;
  address: string;
  blood_group: string;
  medical_history: string;
  }>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'M',
    email: '',
    phone: '',
    address: '',
    blood_group: '',
    medical_history: '',
});
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientService.getAll();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patientService.create(formData);
      setShowAddModal(false);
      resetForm();
      fetchPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Failed to create patient');
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    try {
      await patientService.update(selectedPatient.id, formData);
      setShowEditModal(false);
      resetForm();
      fetchPatients();
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Failed to update patient');
    }
  };

  const handleDeletePatient = async (id: number) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    
    try {
      await patientService.delete(id);
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Failed to delete patient');
    }
  };

  const handleViewPatient = async (id: number) => {
    try {
      const patient = await patientService.getById(id);
      setSelectedPatient(patient);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleEditClick = async (id: number) => {
    try {
      const patient = await patientService.getById(id);
      setSelectedPatient(patient);
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        blood_group: patient.blood_group || '',
        medical_history: patient.medical_history || '',
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'M',
      email: '',
      phone: '',
      address: '',
      blood_group: '',
      medical_history: '',
    });
    setSelectedPatient(null);
  };

  const filteredPatients = patients.filter(patient =>
    patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">MediSight</h1>
              <p className="text-gray-400 text-sm">AI-Powered Clinical Decision Support</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/">
              <button className="px-6 py-2 rounded-lg transition bg-gray-900 text-gray-400 hover:text-white">
                Dashboard
              </button>
            </Link>
            <button className="px-6 py-2 rounded-lg transition bg-blue-600 text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Patients
            </button>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Patient Management</h2>
          <p className="text-gray-400 mt-1">Manage patient records and medical history</p>
        </div>
        <div className="flex gap-3">
          {patients.length > 0 && (
            <button 
              onClick={() => exportPatientsToCSV(patients)}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </button>
          )}
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Patient
          </button>
        </div>
      </div>
      {/* <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Patient Management</h2>
          <p className="text-gray-400 mt-1">Manage patient records and medical history</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Patient
        </button>
      </div> */}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Patients Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Patient ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Age</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Gender</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Registered</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Predictions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      {searchTerm ? 'No patients found matching your search' : 'No patients yet. Add your first patient to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-800 transition">
                      <td className="px-6 py-4 text-sm text-white font-mono">{patient.patient_id}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{patient.age}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {new Date(patient.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-xs">
                          {patient.prediction_count} predictions
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewPatient(patient.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button 
                            onClick={() => handleEditClick(patient.id)}
                            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition text-xs flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeletePatient(patient.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Add New Patient</h3>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'O' })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="+1-555-0100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Blood Group</label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Medical History</label>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Previous conditions, allergies, surgeries..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Edit Patient</h3>
              <button
                onClick={() => { setShowEditModal(false); resetForm(); }}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditPatient} className="space-y-4">
              {/* Same form fields as Add Modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'O' })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Blood Group</label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Medical History</label>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Update Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient Modal */}
      {showViewModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedPatient.full_name}</h3>
                <p className="text-gray-400">{selectedPatient.patient_id}</p>
              </div>
              <button
                onClick={() => { setShowViewModal(false); setSelectedPatient(null); }}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Age</p>
                    <p className="text-white font-medium">{selectedPatient.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Gender</p>
                    <p className="text-white font-medium">
                      {selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Date of Birth</p>
                    <p className="text-white font-medium">{new Date(selectedPatient.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Blood Group</p>
                    <p className="text-white font-medium">{selectedPatient.blood_group || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-medium">{selectedPatient.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-white font-medium">{selectedPatient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <p className="text-white font-medium">{selectedPatient.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              {selectedPatient.medical_history && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Medical History</h4>
                  <p className="text-gray-300">{selectedPatient.medical_history}</p>
                </div>
              )}

              {/* Statistics */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Predictions</p>
                    <p className="text-white font-medium text-2xl">{selectedPatient.prediction_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Registered</p>
                    <p className="text-white font-medium">{new Date(selectedPatient.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditClick(selectedPatient.id);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Patient
                </button>
                <button
                  onClick={() => { setShowViewModal(false); setSelectedPatient(null); }}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>  
      )}
    </div>
  );
}