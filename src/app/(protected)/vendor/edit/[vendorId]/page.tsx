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

export default function VendorFormPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.vendorId as string | undefined;

  const primaryColor = useSelector((s: RootState) => s.ui.primaryColor) || '#4F46E5';

  const [companies, setCompanies] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [postals, setPostals] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState<any>({
    vendor_name: '',
    photo: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country_id: '',
    state_id: '',
    city_id: '',
    postal_code_id: '',
    address_1: '',
    company_id: '',
    role_id: '',
    region_id: '',
    status: true,
  });

  const setField = (k: string, v: any) => setFormData((prev: any) => ({ ...prev, [k]: v }));

  const handlePasswordChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (field === 'confirmPassword') {
      setPasswordError(value !== formData.password ? 'Passwords do not match' : '');
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
    const filePath = path.replace(/^\/+/, '');
    return `${baseUrl}/${filePath}`;
  };

  // Load reference data
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

  // Load states when country changes
  useEffect(() => {
    if (!formData.country_id) {
      setStates([]);
      setFormData((prev: any) => ({ ...prev, state_id: '', city_id: '', postal_code_id: '' }));
      return;
    }
    const loadStates = async () => {
      try {
        const res = await api.get(URLS.GET_STATES + `?country_id=${formData.country_id}`);
        setStates(res.data?.data ?? []);
      } catch {
        setStates([]);
      }
    };
    loadStates();
  }, [formData.country_id]);

  // Load cities when state changes
  useEffect(() => {
    if (!formData.state_id) {
      setCities([]);
      setFormData((prev: any) => ({ ...prev, city_id: '', postal_code_id: '' }));
      return;
    }
    const loadCities = async () => {
      try {
        const res = await api.get(URLS.GET_CITIES + `?state_id=${formData.state_id}`);
        setCities(res.data?.data ?? []);
      } catch {
        setCities([]);
      }
    };
    loadCities();
  }, [formData.state_id]);

  // Load postal codes when city changes
  useEffect(() => {
    if (!formData.city_id) {
      setPostals([]);
      setFormData((prev: any) => ({ ...prev, postal_code_id: '' }));
      return;
    }
    const loadPostals = async () => {
      try {
        const res = await api.get(URLS.GET_POSTALS + `?city_id=${formData.city_id}`);
        setPostals(res.data?.data ?? []);
      } catch {
        setPostals([]);
      }
    };
    loadPostals();
  }, [formData.city_id]);

  // Load vendor data for edit
  useEffect(() => {
    if (!vendorId) return;

    const fetchVendor = async () => {
      try {
        const res = await api.get(URLS.GET_VENDOR_BY_ID.replace('{id}', vendorId));
        const data = res.data?.data ?? res.data;
        if (data) {
          setFormData({
            ...formData,
            ...data,
            password: '',
            confirmPassword: '',
            country_id: data.country_id ?? '',
            state_id: data.state_id ?? '',
            city_id: data.city_id ?? '',
            postal_code_id: data.postal_code_id ?? '',
          });
          setPhotoFile(null);
        }
      } catch (err) {
        console.error('Failed to fetch vendor:', err);
        alert('Failed to load vendor data.');
      }
    };
    fetchVendor();
  }, [vendorId]);

  const handleSave = async () => {
    if (!formData.vendor_name) return alert('Vendor name is required.');
    if (!formData.email) return alert('Email is required.');
    if (!formData.phone) return alert('Phone is required.');
    if (formData.password && formData.password !== formData.confirmPassword)
      return alert('Passwords do not match.');
    if (!formData.company_id) return alert('Company selection is required.');
    if (!formData.role_id) return alert('Role is required.');
    if (!formData.region_id) return alert('Region is required.');
    if (!formData.country_id) return alert('Country is required.');
    if (!formData.state_id) return alert('State is required.');
    if (!formData.city_id) return alert('City is required.');
    if (!formData.postal_code_id) return alert('Postal Code is required.');

    try {
      const hasFile = !!photoFile;
      if (hasFile) {
        const form = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
          if (['confirmPassword'].includes(k)) return;
          if (v === '' || v === null || v === undefined) return;
          form.append(k, typeof v === 'boolean' || typeof v === 'number' ? v.toString() : v);
        });
        if (photoFile) form.append('photo', photoFile);

        await api.put(URLS.UPDATE_VENDOR.replace('{id}', vendorId), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload = { ...formData };
        delete payload.confirmPassword;
        await api.put(URLS.UPDATE_VENDOR.replace('{id}', vendorId), payload);
      }

      alert('Vendor saved successfully!');
      router.push('/vendor');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || err?.message || 'Failed to save vendor.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{vendorId ? 'Edit Vendor' : 'Create Vendor'}</h1>
      <Card className="p-6 space-y-8">
        {/* Photo Section */}
        <div>
          <Label>Vendor Photo</Label>
          <div className="flex items-center gap-4 mt-2">
            {photoFile ? (
              <img src={URL.createObjectURL(photoFile)} alt="Photo" className="w-32 h-32 object-contain border rounded-lg" />
            ) : formData.photo ? (
              <img src={getImageUrl(formData.photo)} alt="Photo" className="w-32 h-32 object-contain border rounded-lg" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">No Photo</div>
            )}
            <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="border-2 border-dashed p-2" />
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Vendor Name</Label><Input value={formData.vendor_name} onChange={(e) => setField('vendor_name', e.target.value)} /></div>

          <div>
            <Label>Company</Label>
            <Select value={formData.company_id} onValueChange={(v) => setField('company_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Company" /></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.company_id} value={String(c.company_id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setField('phone', e.target.value)} /></div>

          {/* Password */}
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handlePasswordChange('password', e.target.value)} className="pr-10" />
              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowPassword(p => !p)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <div>
            <Label>Confirm Password</Label>
            <div className="relative">
              <Input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} className="pr-10" />
              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowConfirmPassword(p => !p)}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
          </div>

          {/* Role & Region */}
          <div>
            <Label>Role</Label>
            <Select value={formData.role_id} onValueChange={(v) => setField('role_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Role" /></SelectTrigger>
              <SelectContent>{roles.map(r => <SelectItem key={r.role_id} value={r.role_id}>{r.role_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Region</Label>
            <Select value={formData.region_id} onValueChange={(v) => setField('region_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Region" /></SelectTrigger>
              <SelectContent>{regions.map(r => <SelectItem key={r.region_id} value={r.region_id}>{r.region_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Cascading Dropdowns */}
          <div>
            <Label>Country</Label>
            <Select value={String(formData.country_id)} onValueChange={(v) => setField('country_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Country" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c.country_id} value={String(c.country_id)}>{c.country_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>State / Province</Label>
            <Select value={String(formData.state_id)} onValueChange={(v) => setField('state_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
              <SelectContent>{states.map(s => <SelectItem key={s.state_id} value={String(s.state_id)}>{s.state_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>City</Label>
            <Select value={String(formData.city_id)} onValueChange={(v) => setField('city_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select City" /></SelectTrigger>
              <SelectContent>{cities.map(c => <SelectItem key={c.city_id} value={String(c.city_id)}>{c.city_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Postal Code</Label>
            <Select value={String(formData.postal_code_id)} onValueChange={(v) => setField('postal_code_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Postal Code" /></SelectTrigger>
              <SelectContent>{postals.map(p => <SelectItem key={p.postal_code_id} value={String(p.postal_code_id)}>{p.postal_code}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2"><Label>Address</Label><Input value={formData.address_1} onChange={(e) => setField('address_1', e.target.value)} /></div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-3 mt-4">
          <button type="button" onClick={() => setField('status', !formData.status)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.status ? 'bg-green-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm font-medium">{formData.status ? 'Active' : 'Inactive'}</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="destructive" onClick={() => router.push('/vendor')}>Cancel</Button>
          <Button style={{ backgroundColor: primaryColor, color: '#fff' }} onClick={handleSave}>{vendorId ? 'Update' : 'Save'}</Button>
        </div>
      </Card>
    </div>
  );
}
