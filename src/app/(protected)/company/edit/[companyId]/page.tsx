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

export default function CompanyFormPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.companyId as string | undefined;
  const primaryColor = useSelector((s: RootState) => s.ui.primaryColor) || '#4F46E5';

  const [countries, setCountries] = useState<any[]>([]);
  const [allStates, setAllStates] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [postals, setPostals] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [formData, setFormData] = useState<any>({
    logo: '',
    proof: '',
    name: '',
    gst: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address_1: '',
    country_id: '',
    state_id: '',
    district_id: '',
    postal_code: '',
    city: '',
    lat: '',
    lng: '',
    subscription_id: '',
    no_of_users: '',
    subscription_startDate: '',
    subscription_endDate: '',
    subscription_amountPerUser: '',
    remarks: '',
    theme_color: primaryColor,
    status: true,
  });

  const setField = (k: string, v: any) =>
    setFormData(prev => ({ ...prev, [k]: v }));

  const handlePasswordChange = (field: string, value: string) => {
    setField(field, value);
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

  const safeValue = (val: any) => (val === null || val === undefined ? '' : val);

  // Load references: countries, states, subscriptions
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [countriesRes, statesRes, subsRes] = await Promise.all([
          api.get(URLS.GET_COUNTRIES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_STATES).catch(() => ({ data: { data: [] } })),
          api.get(URLS.GET_SUBSCRIPTION_TYPES).catch(() => ({ data: { data: [] } })),
        ]);
        setCountries(countriesRes.data?.data ?? []);
        setAllStates(statesRes.data?.data ?? []);
        setSubscriptions(subsRes.data?.data ?? []);
      } catch {
        setCountries([]);
        setAllStates([]);
        setSubscriptions([]);
      }
    };
    loadRefs();
  }, []);

  // Fetch company data if editing
  useEffect(() => {
    if (!companyId) return;

    const fetchCompany = async () => {
      try {
        const res = await api.get(URLS.GET_COMPANY_BY_ID.replace('{id}', companyId));
        const data = res.data?.data ?? res.data;
        if (!data) return;

        setFormData(prev => ({
          ...prev,
          ...data,
          country_id: data.country_id ? String(data.country_id) : '',
          state_id: data.state_id ? String(data.state_id) : '',
          district_id: data.city ? String(data.city) : '',
          postal_code: data.postal_code ? String(data.postal_code) : '',
          subscription_startDate: data.subscription_startDate ? data.subscription_startDate.split('T')[0] : '',
          subscription_endDate: data.subscription_endDate ? data.subscription_endDate.split('T')[0] : '',
          password: '',
          confirmPassword: '',
        }));
      } catch (err) {
        console.error('Failed to fetch company:', err);
        alert('Failed to load company data.');
      }
    };

    fetchCompany();
  }, [companyId]);

  // Filter states when country changes
  useEffect(() => {
    if (!formData.country_id) {
      setStates([]);
      setField('state_id', '');
      return;
    }
    const filtered = allStates.filter(s => String(s.country_id) === String(formData.country_id));
    setStates(filtered);
  }, [formData.country_id, allStates]);

  // Load districts when state changes
  useEffect(() => {
    if (!formData.state_id) {
      setDistricts([]);
      setField('district_id', '');
      return;
    }
    const loadDistricts = async () => {
      try {
        const res = await api.get(`${URLS.GET_DISTRICTS}?state_id=${formData.state_id}`);
        setDistricts(res.data?.data ?? []);
      } catch {
        setDistricts([]);
      }
    };
    loadDistricts();
  }, [formData.state_id]);

  // Load postals when district changes
  useEffect(() => {
    if (!formData.district_id) {
      setPostals([]);
      setField('postal_code', '');
      setField('lat', '');
      setField('lng', '');
      return;
    }
    const loadPostals = async () => {
      try {
        const res = await api.get(`${URLS.GET_PINCODES}?district_id=${formData.district_id}`);
        setPostals(res.data?.data ?? []);
      } catch {
        setPostals([]);
      }
    };
    loadPostals();
  }, [formData.district_id]);

  // Set lat/lng when postal changes
  useEffect(() => {
    if (!formData.postal_code) {
      setField('lat', '');
      setField('lng', '');
      return;
    }
    const selected = postals.find(p => String(p.pincode) === String(formData.postal_code));
    if (selected) {
      setField('lat', selected.lat);
      setField('lng', selected.lng);
    }
  }, [formData.postal_code, postals]);

  const handleSave = async () => {
    if (!formData.name) return alert('Company name is required.');
    if (!formData.email) return alert('Email is required.');
    if (!formData.phone) return alert('Phone is required.');
    if (formData.password && formData.password !== formData.confirmPassword)
      return alert('Passwords do not match.');

    try {
      const payload: any = { ...formData };
      delete payload.confirmPassword;

      // Send district UUID as city
      payload.city = formData.district_id;
      payload.postal_code = formData.postal_code;
      delete payload.district_id;

      if (payload.subscription_startDate)
        payload.subscription_startDate = payload.subscription_startDate.split('T')[0];
      if (payload.subscription_endDate)
        payload.subscription_endDate = payload.subscription_endDate.split('T')[0];

      const hasFiles = logoFile || proofFile;
      if (hasFiles) {
        const form = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v === '' || v === null || v === undefined) return;
          form.append(k, typeof v === 'boolean' || typeof v === 'number' ? v.toString() : v);
        });
        if (logoFile) form.append('logo', logoFile);
        if (proofFile) form.append('proof', proofFile);
        await api.put(URLS.UPDATE_COMPANY.replace('{id}', companyId), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.put(URLS.UPDATE_COMPANY.replace('{id}', companyId), payload);
      }

      alert('Company saved successfully!');
      router.push('/company');
    } catch (err: any) {
      console.error(err.response || err);
      alert(err?.response?.data?.error || err?.message || 'Failed to save company.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{companyId ? 'Edit Company' : 'Create Company'}</h1>
      <Card className="p-6 space-y-8">

    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
           <div>
            <Label>Company Logo</Label>
             {logoFile && <p className="text-sm mt-1">{logoFile.name}</p>}
            {!logoFile && formData.logo && <img src={getImageUrl(formData.logo)} alt="Logo" className="w-32 h-32 object-contain mt-2" />}
            <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
           
          </div>
</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Country */}
          <div>
            <Label>Country</Label>
            <Select value={String(formData.country_id)} onValueChange={(v) => setField('country_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Country" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c.country_id} value={String(c.country_id)}>{c.country_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* State */}
          <div>
            <Label>State</Label>
            <Select value={String(formData.state_id)} onValueChange={(v) => setField('state_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
              <SelectContent>{states.map(s => <SelectItem key={s.state_id} value={String(s.state_id)}>{s.state_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* District */}
          <div>
            <Label>District</Label>
            <Select value={String(formData.district_id)} onValueChange={(v) => setField('district_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select District" /></SelectTrigger>
              <SelectContent>{districts.map(d => <SelectItem key={d.district_id} value={String(d.district_id)}>{d.district_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Postal */}
          <div>
            <Label>Postal Code</Label>
            <Select value={String(formData.postal_code)} onValueChange={(v) => setField('postal_code', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Postal Code" /></SelectTrigger>
              <SelectContent>{postals.map(p => <SelectItem key={p.id} value={String(p.pincode)}>{p.pincode}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Latitude / Longitude */}
          <div><Label>Latitude</Label><Input value={safeValue(formData.lat)} disabled /></div>
          <div><Label>Longitude</Label><Input value={safeValue(formData.lng)} disabled /></div>

          {/* Password / Confirm Password */}
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} value={safeValue(formData.password)} onChange={(e) => handlePasswordChange('password', e.target.value)} className="pr-10" />
              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirm Password</Label>
            <div className="relative">
              <Input type={showConfirmPassword ? 'text' : 'password'} value={safeValue(formData.confirmPassword)} onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} className="pr-10" />
              <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500" onClick={() => setShowConfirmPassword(p => !p)}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
          </div>

          {/* Logo & Proof */}
       
          <div>
            <Label>Company Proof</Label>
            <Input type="file" accept="application/pdf,image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
            {proofFile && <p className="text-sm mt-1">{proofFile.name}</p>}
            {!proofFile && formData.proof && (formData.proof.endsWith('.pdf') ? <a href={getImageUrl(formData.proof)} target="_blank" className="text-blue-600 underline">View PDF</a> : <img src={getImageUrl(formData.proof)} alt="Proof" className="w-32 h-32 object-contain mt-2" />)}
          </div>

          {/* Theme & Subscription */}
          <div>
            <Label>Theme Color</Label>
            <Input type="color" value={safeValue(formData.theme_color)} onChange={(e) => setField('theme_color', e.target.value)} />
            <span className="ml-2">{safeValue(formData.theme_color)}</span>
          </div>
          <div>
            <Label>Subscription Plan</Label>
            <Select value={formData.subscription_id} onValueChange={(v) => setField('subscription_id', v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Subscription" /></SelectTrigger>
              <SelectContent>{subscriptions.map(s => <SelectItem key={s.subscription_id} value={s.subscription_id}>{s.subscription_title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>No. of Users</Label><Input type="number" value={safeValue(formData.no_of_users)} onChange={(e) => setField('no_of_users', e.target.value)} /></div>
          <div><Label>Amount per User</Label><Input type="number" value={safeValue(formData.subscription_amountPerUser)} onChange={(e) => setField('subscription_amountPerUser', e.target.value)} /></div>
          <div><Label>Start Date</Label><Input type="date" value={safeValue(formData.subscription_startDate)} onChange={(e) => setField('subscription_startDate', e.target.value)} /></div>
          <div><Label>End Date</Label><Input type="date" value={safeValue(formData.subscription_endDate)} onChange={(e) => setField('subscription_endDate', e.target.value)} /></div>

          {/* Remarks & Status */}
          <div><Label>Remarks</Label><Input value={safeValue(formData.remarks)} onChange={(e) => setField('remarks', e.target.value)} /></div>
         <div className="flex items-center gap-2">
  <Label>Status</Label>
  <button
    type="button"
    onClick={() => setField('status', !formData.status)}
    className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${
      formData.status ? 'bg-green-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
        formData.status ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </button>
  <span className="ml-2 font-medium">{formData.status ? 'Active' : 'Inactive'}</span>
</div>

        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="destructive" onClick={() => router.push('/company')}>Cancel</Button>
          <Button style={{ backgroundColor: formData.theme_color, color: '#fff' }} onClick={handleSave}>{companyId ? 'Update' : 'Save'}</Button>
        </div>
      </Card>
    </div>
  );
}
