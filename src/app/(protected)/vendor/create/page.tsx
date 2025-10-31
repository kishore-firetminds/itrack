'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

import api from '@/utils/api';
import { URLS } from '@/utils/urls';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import bcrypt from 'bcryptjs';

// ---------- Types ----------
type CountryRow = { country_id: string | number; country_name: string };
type StateRow = { state_id: string | number; state_name: string };
type RoleRow = { role_id: string; role_name: string };
type RegionRow = { region_id: string; region_name: string };
type CompanyRow = { company_id: string; name: string };
type DistrictRow = { district_id: string; district_name: string };
type PostalRow = { pincode: string; district_id: string };

// ---------- Component ----------
export default function CreateVendorPage() {
  const router = useRouter();
  const primaryColor = useSelector((s: RootState) => s.ui.primaryColor) || '#4F46E5';

  // ---------- States ----------
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [postals, setPostals] = useState<PostalRow[]>([]);
  const [filteredPostals, setFilteredPostals] = useState<PostalRow[]>([]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  // ---------- Form Data ----------
  const [formData, setFormData] = useState({
    company_id: '',
    vendor_name: '',
    photo: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country_id: '',
    state_id: '',
    district_id: '',
    postal_code: '',
    address_1: '',
    role_id: '',
    region_id: '',
  });

  // ---------- Helpers ----------
  const setField = (k: string, v: any) => setFormData((prev) => ({ ...prev, [k]: v }));

  const handlePasswordChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'confirmPassword') {
      setPasswordError(value !== formData.password ? 'Passwords do not match' : '');
    }
  };

  // ---------- Load Reference Data ----------
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [companiesRes, countriesRes, rolesRes, regionsRes] = await Promise.all([
          api.get(URLS.GET_COMPANIES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_COUNTRIES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_ROLES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_REGION).catch(() => ({ data: { data: [] } })),
        ]);

        setCompanies(companiesRes.data?.data ?? []);
        setCountries(countriesRes.data?.data ?? []);
        setRoles(rolesRes.data?.data ?? []);
        setRegions(regionsRes.data?.data ?? []);
      } catch {
        setCompanies([]);
        setCountries([]);
        setRoles([]);
        setRegions([]);
      }
    };
    loadRefs();
  }, []);

  // ---------- Prefill User Role & Company ----------
  useEffect(() => {
    try {
      const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (rawUser) {
        const user = JSON.parse(rawUser);
        setUserRole(user?.role?.slug || '');

        if (user?.role?.slug !== 'super_admin') {
          setFormData((prev) => ({
            ...prev,
            company_id: user.company_id || '',
          }));
        }
      }
    } catch (err) {
      console.error('Failed to read auth user:', err);
    }
  }, []);

  // ---------- Cascading Dropdowns ----------
  useEffect(() => {
    const loadStates = async () => {
      if (!formData.country_id) {
        setStates([]);
        setDistricts([]);
        setPostals([]);
        setField('state_id', '');
        setField('district_id', '');
        setField('postal_code', '');
        return;
      }
      try {
        const res = await api.get(URLS.GET_STATES, { params: { country_id: formData.country_id } });
        setStates(res.data?.data ?? []);
        setDistricts([]);
        setPostals([]);
        setField('state_id', '');
        setField('district_id', '');
        setField('postal_code', '');
      } catch {
        setStates([]);
      }
    };
    loadStates();
  }, [formData.country_id]);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.state_id) {
        setDistricts([]);
        setPostals([]);
        setField('district_id', '');
        setField('postal_code', '');
        return;
      }
      try {
        const res = await api.get(URLS.GET_DISTRICTS, { params: { state_id: formData.state_id } });
        setDistricts(res.data?.data ?? []);
        setPostals([]);
        setFilteredPostals([]);
        setField('district_id', '');
        setField('postal_code', '');
      } catch {
        setDistricts([]);
      }
    };
    loadDistricts();
  }, [formData.state_id]);

  useEffect(() => {
    const loadPostals = async () => {
      if (!formData.district_id) {
        setPostals([]);
        setFilteredPostals([]);
        setField('postal_code', '');
        return;
      }
      try {
        const res = await api.get(URLS.GET_PINCODES); // fetch all pincodes
        const allPincodes = res.data?.data ?? [];

        const districtPincodes = allPincodes.filter(
          (p: PostalRow) => p.district_id === formData.district_id
        );

        setPostals(districtPincodes);
        setFilteredPostals(districtPincodes);
        setField('postal_code', '');
      } catch (err: any) {
        console.error('Failed to load pincodes:', err.message);
        setPostals([]);
        setFilteredPostals([]);
        setField('postal_code', '');
      }
    };
    loadPostals();
  }, [formData.district_id]);

  // ---------- Save ----------
  const handleSave = async () => {
    if (passwordError) return;
    const requiredFields = [
      'company_id',
      'vendor_name',
      'email',
      'phone',
      'password',
      'role_id',
      'region_id',
      'state_id',
      'district_id',
      'postal_code',
    ];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        return alert(`${field.replace('_', ' ')} is required.`);
      }
    }
    if (formData.password !== formData.confirmPassword) return alert('Passwords do not match.');

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'confirmPassword' || k === 'photo') return;
        if (k === 'password') {
          const hashed = bcrypt.hashSync(String(v), 10);
          form.append('password', hashed);
        } else {
          form.append(k, v ?? '');
        }
      });
      if (photoFile) form.append('photo', photoFile);

      const roleName = roles.find((r) => String(r.role_id) === String(formData.role_id))?.role_name || '';
      const regionName = regions.find((r) => String(r.region_id) === String(formData.region_id))?.region_name || '';
      form.append('role_name', roleName);
      form.append('region', regionName);

      await api.post(URLS.CREATE_VENDOR, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Vendor created successfully!');
      router.push('/vendor');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || err?.message || 'Failed to create vendor.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create Vendor</h1>
      <Card className="p-6 space-y-8">
        {/* Vendor Photo & Info */}
        <h2 className="text-lg font-semibold">Vendor & Password Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Vendor Photo</Label>
            <div className="flex items-center gap-4 mt-2">
              {photoFile ? (
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="Photo Preview"
                  className="w-32 h-32 object-contain border rounded-lg"
                />
              ) : formData.photo ? (
                <img
                  src={formData.photo}
                  alt="Photo Preview"
                  className="w-32 h-32 object-contain border rounded-lg"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">
                  No Photo
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="border-2 border-dashed p-2"
              />
            </div>
          </div>

          <div>
            <Label>Vendor Name</Label>
            <Input value={formData.vendor_name} onChange={(e) => setField('vendor_name', e.target.value)} />
          </div>

          <div>
            <Label>Company</Label>
            <Select
              value={String(formData.company_id)}
              onValueChange={(v) => setField('company_id', v)}
              disabled={userRole !== 'super_admin' && !!formData.company_id}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Company" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.company_id} value={String(c.company_id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} />
          </div>

          <div>
            <Label>Phone</Label>
            <Input value={formData.phone} onChange={(e) => setField('phone', e.target.value)} />
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setField('password', e.target.value)} className="pr-10" />
              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowPassword((p) => !p)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <Label>Confirm Password</Label>
            <div className="relative">
              <Input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} className="pr-10" />
              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowConfirmPassword((p) => !p)}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
          </div>
        </div>

        {/* Location & Address */}
        <h2 className="text-lg font-semibold">Location & Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Country</Label>
            <Select value={String(formData.country_id)} onValueChange={(v) => setField('country_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Country" /></SelectTrigger>
              <SelectContent>{countries.map((c) => <SelectItem key={c.country_id} value={String(c.country_id)}>{c.country_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>State / Province</Label>
            <Select value={String(formData.state_id)} onValueChange={(v) => setField('state_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
              <SelectContent>{states.map((s) => <SelectItem key={s.state_id} value={String(s.state_id)}>{s.state_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>District (City)</Label>
            <Select value={String(formData.district_id)} onValueChange={(v) => setField('district_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select District" /></SelectTrigger>
              <SelectContent>{districts.map((d) => <SelectItem key={d.district_id} value={String(d.district_id)}>{d.district_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Postal Code</Label>
            <Select value={String(formData.postal_code)} onValueChange={(v) => setField('postal_code', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Postal Code" /></SelectTrigger>
              <SelectContent className="max-h-64 overflow-auto">
                <Input
                  placeholder="Search Postal Code..."
                  className="mb-2 p-1 w-full border rounded"
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    setFilteredPostals(
                      postals.filter((p) =>
                        String(p.pincode).toLowerCase().includes(search)
                      )
                    );
                  }}
                />
                {(filteredPostals.length > 0 ? filteredPostals : postals).map((p, idx) => (
                  <SelectItem key={idx} value={p.pincode}>
                    {p.pincode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input value={formData.address_1} onChange={(e) => setField('address_1', e.target.value)} />
          </div>
        </div>

        {/* Role & Region */}
        <h2 className="text-lg font-semibold">Role & Region</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Role</Label>
            <Select value={String(formData.role_id)} onValueChange={(v) => setField('role_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Role" /></SelectTrigger>
              <SelectContent>{roles.filter((r) => r.role_name === 'Vendor / Contractor').map((r) => <SelectItem key={r.role_id} value={r.role_id}>{r.role_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Region</Label>
            <Select value={String(formData.region_id)} onValueChange={(v) => setField('region_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Region" /></SelectTrigger>
              <SelectContent>{regions.map((r) => <SelectItem key={r.region_id} value={r.region_id}>{r.region_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="destructive" onClick={() => router.push('/vendor')}>Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 text-white">Save</Button>
        </div>
      </Card>
    </div>
  );
}
