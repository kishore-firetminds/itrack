'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string | undefined;

  const primaryColor = useSelector((s: RootState) => s.ui.primaryColor ?? '#4F46E5');
  const userRole = useSelector((s: RootState) => s.auth?.user?.role_name ?? '');
  const userCompanyId = useSelector((s: RootState) => s.auth?.user?.company_id ?? '');

  const [companies, setCompanies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState<any>({
    company_id: '',
    role_id: '',
    vendor_id: '',
    supervisor_id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    photo: '',
    emergency_contact: '',
    address_1: '',
    country_id: '',
    state_id: '',
    city: '',
    postal_code: '',
    lat: '',
    lng: '',
    region_ids: [] as string[],
    region_id: '',
    shift_id: '',
    proof: '',
  });

  const setField = (key: string, value: any) =>
    setFormData((prev: any) => ({ ...prev, [key]: value }));

  // Load reference data
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [
          companiesRes,
          rolesRes,
          vendorsRes,
          countriesRes,
          statesRes,
          regionsRes,
          usersRes,
          shiftsRes,
        ] = await Promise.all([
          api.get(URLS.GET_COMPANIES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_ROLES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_VENDORS).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_COUNTRIES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_STATES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_REGION).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_USERS).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_SHIFT).catch(() => ({ data: { data: [] } })),
        ]);

        setCompanies(companiesRes.data?.data ?? []);
        setRoles(rolesRes.data?.data ?? []);
        setVendors(vendorsRes.data?.data ?? []);
        setCountries(countriesRes.data?.data ?? []);
        setStates(statesRes.data?.data ?? []);
        setRegions(regionsRes.data?.data ?? []);
        setUsers(usersRes.data?.data ?? []);
        setShifts(shiftsRes.data?.data ?? []);
      } catch {
        setCompanies([]);
        setRoles([]);
        setVendors([]);
        setCountries([]);
        setStates([]);
        setRegions([]);
        setUsers([]);
        setShifts([]);
      }
    };
    loadRefs();
  }, []);

  // Auto-fill company_id for non-super-admin
  useEffect(() => {
    if (userRole !== 'super_admin' && userCompanyId) {
      setField('company_id', userCompanyId);
    }
  }, [userRole, userCompanyId]);

  // Load user data for edit
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(URLS.GET_USER_BY_ID.replace('{id}', userId));
        const data = res.data?.data ?? res.data;
        if (data) setFormData({ ...formData, ...data, password: '', confirmPassword: '' });
      } catch (err) {
        console.error('Failed to fetch user:', err);
        alert('Failed to load user data.');
      }
    };

    fetchUser();
  }, [userId]);

  // Password handler
  const handlePasswordChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (field === 'password' && formData.confirmPassword) {
      setPasswordError(value !== formData.confirmPassword ? 'Passwords do not match' : '');
    }
    if (field === 'confirmPassword') {
      setPasswordError(value !== formData.password ? 'Passwords do not match' : '');
    }
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.company_id) {
      alert('Please fill all required fields.');
      return false;
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        alert('Password and Confirm Password do not match.');
        return false;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters.');
        return false;
      }
    }

    const selectedRole = roles.find(r => r.role_id === formData.role_id)?.role_name?.toLowerCase();

    if ((selectedRole === 'technician' || selectedRole === 'supervisor') && !formData.vendor_id) {
      alert('Vendor is required for Technician/Supervisor.');
      return false;
    }

    const vendor = vendors.find(v => v.vendor_id === formData.vendor_id);
    if (vendor && vendor.company_id !== formData.company_id) {
      alert('Vendor must belong to the selected company.');
      return false;
    }

    const supervisor = users.find(u => u.user_id === formData.supervisor_id);
    if (supervisor) {
      const supervisorRole = (supervisor.role_name ?? supervisor.role?.role_name ?? '').toLowerCase();
      if (
        supervisor.company_id !== formData.company_id ||
        !['supervisor', 'supervisor / dispatcher'].includes(supervisorRole)
      ) {
        alert('Supervisor must belong to the selected company and have Supervisor role.');
        return false;
      }
    }

    return true;
  };

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) return;
        if (Array.isArray(v)) v.forEach(val => form.append(`${k}[]`, val));
        else form.append(k, v as any);
      });

      if (photoFile) form.append('photo', photoFile);
      if (proofFile) form.append('proof', proofFile);

      if (userId) {
        await api.put(URLS.UPDATE_USER.replace('{id}', userId), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('User updated successfully!');
      } else {
        await api.post(URLS.CREATE_USER, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('User created successfully!');
      }

      router.push('/user');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || err.message || 'Failed to save user.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{userId ? 'Edit User' : 'Create User'}</h1>

      <Card className="p-6 space-y-6">
        {/* Photo / Logo Section */}
        <div className="space-y-2">
          <Label>Photo / Logo</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex justify-center">
              {photoFile ? (
                <img src={URL.createObjectURL(photoFile)} alt="Photo Preview" className="w-32 h-32 object-contain border rounded-lg" />
              ) : formData.photo ? (
                <img src={formData.photo} alt="Photo Preview" className="w-32 h-32 object-contain border rounded-lg" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">No Photo</div>
              )}
            </div>
            <div>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="border-2 border-dashed p-2" />
              {photoFile && <p className="mt-2 text-sm text-gray-600">{photoFile.name}</p>}
            </div>
          </div>
        </div>

        {/* Contact & Login Section */}
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <h2 className="text-lg font-medium">Contact & Login</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setField('name', e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setField('phone', e.target.value)} /></div>
            <div><Label>Emergency Contact</Label><Input value={formData.emergency_contact} onChange={(e) => setField('emergency_contact', e.target.value)} /></div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={formData.password} placeholder="Password" onChange={(e) => handlePasswordChange('password', e.target.value)} className="pr-10" />
                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} placeholder="Confirm Password" onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} className="pr-10" />
                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowConfirmPassword(p => !p)}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
            </div>
          </div>
        </div>

        {/* Location & Area Section */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <h2 className="text-lg font-medium">Location & Area</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Address</Label><Input value={formData.address_1} onChange={(e) => setField('address_1', e.target.value)} /></div>
            <div>
              <Label>Country</Label>
              <Select value={formData.country_id} onValueChange={(v) => setField('country_id', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Country" /></SelectTrigger>
                <SelectContent>{countries.map(c => <SelectItem key={c.country_id} value={c.country_id}>{c.country_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>State</Label>
              <Select value={formData.state_id} onValueChange={(v) => setField('state_id', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
                <SelectContent>{states.map(s => <SelectItem key={s.state_id} value={s.state_id}>{s.state_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>City</Label><Input value={formData.city} onChange={(e) => setField('city', e.target.value)} /></div>
            <div><Label>Postal Code</Label><Input value={formData.postal_code} onChange={(e) => setField('postal_code', e.target.value)} /></div>
            <div><Label>Latitude</Label><Input value={formData.lat} onChange={(e) => setField('lat', e.target.value)} /></div>
            <div><Label>Longitude</Label><Input value={formData.lng} onChange={(e) => setField('lng', e.target.value)} /></div>
          </div>
        </div>

        {/* Vendor Details Section */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <h2 className="text-lg font-medium">Vendor Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company</Label>
              <Select value={formData.company_id} onValueChange={(v) => { setField('company_id', v); setField('vendor_id', ''); setField('supervisor_id', ''); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Company" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.company_id} value={c.company_id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vendor</Label>
              <Select value={formData.vendor_id} onValueChange={(v) => setField('vendor_id', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.filter(v => v.company_id === formData.company_id).map(v => <SelectItem key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Region</Label>
              <Select value={formData.region_id} onValueChange={(v) => setField('region_id', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Region" /></SelectTrigger>
                <SelectContent>
                  {regions.filter(r => !formData.company_id || String(r.company_id ?? r.company?.company_id ?? '') === String(formData.company_id))
                    .map(r => <SelectItem key={r.region_id ?? r.id} value={String(r.region_id ?? r.id)}>{r.region_name ?? r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Roles & Supervisor Section */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <h2 className="text-lg font-medium">Roles & Supervisor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Role</Label>
              <Select value={formData.role_id} onValueChange={(v) => setField('role_id', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Role" /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r.role_id} value={r.role_id}>{r.role_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Supervisor</Label>
              <Select value={formData.supervisor_id} onValueChange={(v) => setField('supervisor_id', v)} disabled={!formData.company_id || users.length === 0}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Supervisor" /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => {
                    const roleName = (u.role_name ?? u.role?.role_name ?? '').toLowerCase();
                    const isSupervisor = ['supervisor', 'supervisor / dispatcher'].includes(roleName);
                    const sameCompany = String(u.company_id ?? u.company?.company_id) === String(formData.company_id);
                    const sameVendor = !formData.vendor_id || String(u.vendor_id ?? u.vendor?.vendor_id) === String(formData.vendor_id);
                    return sameCompany && sameVendor || isSupervisor;
                  }).map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shift</Label>
              <Select value={formData.shift_id} onValueChange={(v) => setField('shift_id', v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select Shift" /></SelectTrigger>
                <SelectContent>{shifts.map(s => <SelectItem key={s.shift_id} value={s.shift_id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Proof Section */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <h2 className="text-lg font-medium">Proof Document</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <Input type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
              {proofFile && <p className="mt-2 text-sm text-gray-600">{proofFile.name}</p>}
            </div>
            {formData.proof && !proofFile && <div><a href={formData.proof} target="_blank" className="text-blue-600 underline">View Existing Proof</a></div>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="destructive" onClick={() => router.push('/user')}>Cancel</Button>
          <Button onClick={handleSave} style={{ backgroundColor: primaryColor, color: '#fff' }}>{userId ? 'Update' : 'Save'}</Button>
        </div>
      </Card>
    </div>
  );
}
