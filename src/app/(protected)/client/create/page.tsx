'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function CreateClientPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<any>({
    company_id: '',
    business_typeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address_1: '',
    country_id: '',
    state_id: '',
    district_id: '',
    city_id: '',
    postal_code: '',
    lat: '',
    lng: '',
    visiting_startTime: '',
    visiting_endTime: '',
    available_status: true,
    photo: '',
  });

  const setField = (k: string, v: any) =>
    setFormData((prev: any) => ({ ...prev, [k]: v }));

  // Load companies, business types, countries
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [companiesRes, businessTypesRes, countriesRes] =
          await Promise.all([
            api.get(URLS.GET_COMPANIES).catch(() => ({ data: { data: [] } })),
            api.get(URLS.GET_BUSINESS_TYPES).catch(() => ({ data: { data: [] } })),
            api.get(URLS.GET_COUNTRIES).catch(() => ({ data: { data: [] } })),
          ]);
        setCompanies(companiesRes.data?.data ?? []);
        setBusinessTypes(businessTypesRes.data?.data ?? []);
        setCountries(countriesRes.data?.data ?? []);
      } catch {
        setCompanies([]);
        setBusinessTypes([]);
        setCountries([]);
      }
    };
    loadRefs();
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (!formData.country_id) return;
    const fetchStates = async () => {
      try {
        const res = await api.get(URLS.GET_STATES, { params: { country_id: formData.country_id } });
        setStates(res.data?.data ?? []);
      } catch {
        setStates([]);
      }
      setField('state_id', '');
      setField('district_id', '');
      setField('city_id', '');
      setField('postal_code', '');
      setDistricts([]);
      setCities([]);
      setPincodes([]);
      setField('lat', '');
      setField('lng', '');
    };
    fetchStates();
  }, [formData.country_id]);

  // Load districts when state changes
  useEffect(() => {
    if (!formData.state_id) return;
    const fetchDistricts = async () => {
      try {
        const res = await api.get(URLS.GET_DISTRICTS, { params: { state_id: formData.state_id } });
        setDistricts(res.data?.data ?? []);
      } catch {
        setDistricts([]);
      }
      setField('district_id', '');
      setField('city_id', '');
      setField('postal_code', '');
      setCities([]);
      setPincodes([]);
      setField('lat', '');
      setField('lng', '');
    };
    fetchDistricts();
  }, [formData.state_id]);

  // Load pincodes when district changes
  useEffect(() => {
    if (!formData.district_id) return;
    const fetchPincodes = async () => {
      try {
        const res = await api.get(URLS.GET_PINCODES, { params: { district_id: formData.district_id } });
        setPincodes(res.data?.data ?? []);
      } catch {
        setPincodes([]);
      }
      setField('postal_code', '');
      setField('lat', '');
      setField('lng', '');
    };
    fetchPincodes();
  }, [formData.district_id]);

  // Set lat/lng when pincode selected
  useEffect(() => {
    if (!formData.postal_code) return;
    const selected = pincodes.find((p) => p.pincode === formData.postal_code);
    if (selected) {
      setField('lat', selected.lat || '');
      setField('lng', selected.lng || '');
    } else {
      setField('lat', '');
      setField('lng', '');
    }
  }, [formData.postal_code, pincodes]);

  // Form validation
  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.company_id ||
      !formData.business_typeId
    ) {
      alert('Please fill all required fields.');
      return false;
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
        form.append(k, v as any);
      });
      if (photoFile) form.append('photo', photoFile);

      await api.post(URLS.CREATE_CLIENT, form, { headers: { 'Content-Type': 'multipart/form-data' } });

      alert('Client created successfully!');
      router.push('/client');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || err.message || 'Failed to create client.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create Client</h1>

      <Card className="p-6 space-y-8">
        {/* Photo Upload */}
        <fieldset className="space-y-2">
          <legend className="text-lg font-medium">Photo</legend>
          <div className="flex items-center gap-4">
            {photoFile ? (
              <img
                src={URL.createObjectURL(photoFile)}
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
        </fieldset>

        {/* Basic Information */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium">Basic Information</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={formData.firstName} onChange={(e) => setField('firstName', e.target.value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={formData.lastName} onChange={(e) => setField('lastName', e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* Company & Business */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium">Company & Business</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company</Label>
              <Select value={formData.company_id} onValueChange={(v) => setField('company_id', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={`company-${c.company_id}`} value={c.company_id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Business Type</Label>
              <RadioGroup value={formData.business_typeId} onValueChange={(v) => setField('business_typeId', v)} className="flex justify-between gap-6">
                {businessTypes.map((bt) => (
                  <div key={`bt-${bt.business_typeId}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={bt.business_typeId} id={`bt-${bt.business_typeId}`} />
                    <Label htmlFor={`bt-${bt.business_typeId}`}>{bt.business_typeName}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </fieldset>

        {/* Location & Area */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium">Location & Area</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Address</Label>
              <Input value={formData.address_1} onChange={(e) => setField('address_1', e.target.value)} />
            </div>

            <div>
              <Label>Country</Label>
              <Select value={formData.country_id} onValueChange={(v) => setField('country_id', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={`country-${c.country_id}`} value={c.country_id}>
                      {c.country_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>State</Label>
              <Select value={formData.state_id} onValueChange={(v) => setField('state_id', v)} disabled={!states.length}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={`state-${s.state_id}`} value={s.state_id}>
                      {s.state_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>District</Label>
              <Select value={formData.district_id} onValueChange={(v) => setField('district_id', v)} disabled={!districts.length}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={`district-${d.district_id}`} value={d.district_id}>
                      {d.district_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div>
  <Label>Pincode</Label>
  <Select
    value={formData.postal_code}
    onValueChange={(v) => setField('postal_code', v)}
    disabled={!pincodes.length}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select Pincode" />
    </SelectTrigger>

    <SelectContent className="max-h-60 overflow-auto">
      <Input
        type="text"
        placeholder="Search pincode..."
        className="mb-2 px-2 py-1 w-full border rounded"
        onChange={(e) => {
          const search = e.target.value.toLowerCase();
          setPincodes((prev) =>
            prev.map((p: any) => ({
              ...p,
              hidden: !p.pincode.toLowerCase().includes(search),
            }))
          );
        }}
      />
      {pincodes
        .filter((p) => !p.hidden)
        .map((p) => (
          <SelectItem key={`pincode-${p.pincode}`} value={p.pincode}>
            {p.pincode}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
</div>


            <div>
              <Label>Latitude</Label>
              <Input value={formData.lat} readOnly />
            </div>

            <div>
              <Label>Longitude</Label>
              <Input value={formData.lng} readOnly />
            </div>
          </div>
        </fieldset>

        {/* Available Time */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium">Available Time</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Visiting Start Time</Label>
              <Input type="time" value={formData.visiting_startTime} onChange={(e) => setField('visiting_startTime', e.target.value)} />
            </div>
            <div>
              <Label>Visiting End Time</Label>
              <Input type="time" value={formData.visiting_endTime} onChange={(e) => setField('visiting_endTime', e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="destructive" onClick={() => router.push('/client')}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Create</Button>
        </div>
      </Card>
    </div>
  );
}
