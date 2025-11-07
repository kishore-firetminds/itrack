'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';
import type { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Type definitions to avoid `any`
type Company = { company_id?: string; name?: string };
type BusinessType = { business_typeId: string; business_typeName: string };
type Country = { country_id?: string; country_name?: string };
type State = { state_id?: string; state_name?: string };
type District = { district_id?: string; district_name?: string; id?: string; name?: string };
type Pincode = { pincode: string; lat?: string; lng?: string; hidden?: boolean; id?: string; postal_code?: string; district_id?: string; city_id?: string; city?: string; district?: string };

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId as string | undefined;
 const primaryColor = useSelector((s: RootState) => s.ui.primaryColor) ?? '#4F46E5';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  interface ClientFormData {
    company_id: string;
    business_typeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address_1: string;
    country_id: string;
    state_id: string;
    district_id: string;
    postal_code: string;
    lat: string;
    lng: string;
    visiting_startTime: string;
    visiting_endTime: string;
    available_status: boolean;
    photo: string;
  }

  const [formData, setFormData] = useState<ClientFormData>({
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
    postal_code: '',
    lat: '',
    lng: '',
    visiting_startTime: '',
    visiting_endTime: '',
    available_status: true,
    photo: '',
  });

  const setField = (k: keyof ClientFormData, v: string | boolean) =>
    setFormData((prev) => ({ ...prev, [k]: v }));

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

  // Load client data for edit
  useEffect(() => {
    if (!clientId) return;
    const fetchClient = async () => {
      try {
        const res = await api.get(URLS.GET_CLIENT_BY_ID.replace('{id}', clientId));
        const data = res.data?.data ?? res.data;
        if (data) {
          // normalize IDs and coords to strings so Selects match option values
          const normalized: Partial<ClientFormData> = {
            ...data,
            country_id: data.country_id ? String(data.country_id) : '',
            state_id: data.state_id ? String(data.state_id) : '',
            district_id: data.city ? String(data.city) : (data.district_id ? String(data.district_id) : ''),
            postal_code: data.postal_code ? String(data.postal_code) : (data.pincode ? String(data.pincode) : ''),
            lat: data.lat != null ? String(data.lat) : '',
            lng: data.lng != null ? String(data.lng) : '',
          };
          setFormData((prev) => ({ ...prev, ...normalized }));
          setPhotoFile(null);
          setIsInitialLoad(true);

          // load dependent lists so selects show correct labels
          try {
            // states for country
            if (data.country_id) {
              const sRes = await api.get(URLS.GET_STATES, { params: { country_id: data.country_id } });
              setStates(sRes.data?.data ?? []);
            }

            // districts for state
            let resolvedDistrictId = '';
            if (data.state_id) {
              const dRes = await api.get(URLS.GET_DISTRICTS, { params: { state_id: data.state_id } });
              const districtsFetched = dRes.data?.data ?? [];
              setDistricts(districtsFetched);

              // try to resolve district_id when API returned a city name or district id
              const rawDistrictVal = data.city ?? data.district_id ?? '';
              if (rawDistrictVal) {
                const match = districtsFetched.find((dd: District) => {
                  const name = String(dd.district_name ?? dd.name ?? '').toLowerCase();
                  return String(dd.district_id) === String(rawDistrictVal) || name === String(rawDistrictVal).toLowerCase();
                });
                if (match) {
                  resolvedDistrictId = String(match.district_id ?? match.id);
                  // set resolved district id so Select shows the correct label
                  setField('district_id', resolvedDistrictId);
                } else {
                  resolvedDistrictId = String(rawDistrictVal);
                  setField('district_id', resolvedDistrictId);
                }
              }
            }

            // pincodes for district (use resolvedDistrictId or raw values)
            const districtParam = String(resolvedDistrictId || data.city || data.district_id || data.districtId || '');
            if (districtParam) {
              const pRes = await api.get(URLS.GET_PINCODES, { params: { city_id: districtParam } });
              const list = pRes.data?.data ?? [];
              // prefer pincodes that match the district identifier returned by API
              const filteredByDistrict = list.filter((p: Pincode) => {
                const pid = String(p.district_id ?? (p as any).city_id ?? (p as any).city ?? (p as any).district ?? '');
                return pid && pid === String(districtParam);
              });
              setPincodes((filteredByDistrict.length ? filteredByDistrict : list) as Pincode[]);

              // resolve postal_code and lat/lng from fetched list
              const vendorPostal = data.postal_code ?? data.pincode ?? '';
              if (vendorPostal) {
                const match = list.find((p: Pincode) => String(p.pincode) === String(vendorPostal) || String((p as any).id) === String(vendorPostal));
                if (match) {
                  setField('postal_code', String(match.pincode ?? match.postal_code ?? ''));
                  setField('lat', String(match.lat ?? ''));
                  setField('lng', String(match.lng ?? ''));
                  // ensure the matched pincode exists in state so Select can show it
                  setPincodes((prev: Pincode[]) => (prev.find((x: Pincode) => String(x.pincode) === String(match.pincode)) ? prev : [match, ...prev]));
                } else {
                  setField('postal_code', String(vendorPostal));
                  // if no exact match, include a fallback pincode entry so value can display
                  setPincodes((prev: Pincode[]) => (prev.find((x: Pincode) => String(x.pincode) === String(vendorPostal)) ? prev : [{ pincode: String(vendorPostal), lat: data.lat ? String(data.lat) : '', lng: data.lng ? String(data.lng) : '' }, ...prev]));
                }
              }
            }
          } catch (e) {
            // ignore dependent fetch errors
          } finally {
            // mark initial load complete so cascading effects don't clear these values
            setIsInitialLoad(false);
          }
         }
       } catch (err) {
         console.error(err);
         alert('Failed to load client data.');
       }
     };
     fetchClient();
   }, [clientId]);

   // Load states when country changes
   useEffect(() => {
     if (!formData.country_id) return;
     const fetchStates = async () => {
       try {
         const res = await api.get(URLS.GET_STATES, { params: { country_id: formData.country_id } });
         setStates(res.data?.data ?? []);
         if (!isInitialLoad) {
           setField('state_id', '');
           setField('district_id', '');
           setField('postal_code', '');
           setDistricts([]);
           setPincodes([]);
           setField('lat', '');
           setField('lng', '');
         }
       } catch {
         setStates([]);
       }
     };
     fetchStates();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [formData.country_id]);

   // Load districts (city) when state changes
   useEffect(() => {
     if (!formData.state_id) return;
     const fetchDistricts = async () => {
       try {
         const res = await api.get(URLS.GET_DISTRICTS, { params: { state_id: formData.state_id } });
         setDistricts(res.data?.data ?? []);
         if (!isInitialLoad) {
           setField('district_id', '');
           setField('postal_code', '');
           setPincodes([]);
           setField('lat', '');
           setField('lng', '');
         }
       } catch {
         setDistricts([]);
       }
     };
     fetchDistricts();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [formData.state_id]);

   // Load pincodes when district (city) changes
   useEffect(() => {
     if (!formData.district_id) return;
     const fetchPincodes = async () => {
       try {
         const res = await api.get(URLS.GET_PINCODES, { params: { city_id: formData.district_id } });
         const list = res.data?.data ?? [];
         const filtered = list.filter((p: Pincode) => {
           const pid = String((p as any).district_id ?? (p as any).city_id ?? (p as any).city ?? (p as any).district ?? '');
           return pid && pid === String(formData.district_id);
         });
         setPincodes((filtered.length ? filtered : list) as Pincode[]);
         // ensure existing selected postal_code (if any) is present in pincodes
         if (formData.postal_code) {
           const exists = (filtered.length ? filtered : list).find((p: Pincode) => String(p.pincode) === String(formData.postal_code));
           if (!exists) {
             setPincodes((prev: Pincode[]) => [{ pincode: String(formData.postal_code), lat: formData.lat ?? '', lng: formData.lng ?? '' }, ...prev]);
           }
         }
         if (!isInitialLoad) {
           setField('postal_code', '');
           setField('lat', '');
           setField('lng', '');
         }
       } catch {
         setPincodes([]);
       }
     };
     fetchPincodes();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [formData.district_id]);

   // Set lat/lng when pincode selected
   useEffect(() => {
     if (!formData.postal_code) return;
     const selected = pincodes.find((p: Pincode) => p.pincode === formData.postal_code);
     if (selected) {
       setField('lat', selected.lat || '');
       setField('lng', selected.lng || '');
     } else {
       setField('lat', '');
       setField('lng', '');
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [formData.postal_code, pincodes]);

  // Save handler
  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      alert('First name, last name, email, and phone are required.');
      return;
    }
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        form.append(k, String(v));
      });
      if (photoFile) form.append('photo', photoFile);

      if (clientId) {
        const endpoint = (URLS.UPDATE_CLIENT as string).replace('{id}', clientId);
        await api.put(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const endpoint = (URLS.CREATE_CLIENT as string);
        await api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      alert('Client saved successfully.');
      router.push('/client');
    } catch (err) {
      console.error(err);
      alert('Failed to save client.');
    }
  };

  return (
    <div className="space-y-6">
       <h1 className="text-xl font-semibold">Edit Client</h1>
      <Card className="p-6 space-y-8">
        <div className="mb-4 flex items-center justify-between">
         
         
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Company Logo */}
          <div className="sm:col-span-2">
             <fieldset className="space-y-2">
            <h3 className="text-md font-medium mb-2">Photo</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4"  style={{
        border: "3px dotted #b1b1b1",
        borderRadius: "15px",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        alignItems: "center",
      }}>
                {formData.photo && (
                <img
                  src={getImageUrl(formData.photo)}
                  alt="Client Photo"
                  className="h-20 w-20 rounded-full object-cover"
                />
              )}
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            
            </div></div>
            </fieldset>
          </div>

          {/* Basic Information */}
          <div className="sm:col-span-2">
            <h3 className="text-md font-medium mb-2">Basic Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName" className="pb-3">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="pb-3">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="pb-3">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="email" className="pb-3">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>

          {/* Company & Business */}
          <div className="sm:col-span-2">
            <h3 className="text-md font-medium mb-2">Company & Business</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="company_id" className="pb-3">Company</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(v) => setField('company_id', v)}
                  disabled={!!clientId}
                 
                >
                  <SelectTrigger  className="w-full">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={String(c.company_id)} value={String(c.company_id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="business_typeId" className="pb-3">Business Type</Label>
                <Select
                  value={formData.business_typeId}
                  onValueChange={(v) => setField('business_typeId', v)}
                >
                  <SelectTrigger  className="w-full">
                    <SelectValue placeholder="Select a business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((bt) => (
                      <SelectItem key={String(bt.business_typeId)} value={String(bt.business_typeId)}>
                        {bt.business_typeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location Area */}
          <div className="sm:col-span-2">
            <h3 className="text-md font-medium mb-2">Location Area</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="address_1" className="pb-3">Address</Label>
                <Input
                  id="address_1"
                  value={formData.address_1}
                  onChange={(e) => setField('address_1', e.target.value)}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <Label htmlFor="country_id" className="pb-3">Country</Label>
                <Select
                  value={formData.country_id}
                  onValueChange={(v) => setField('country_id', v)}
                >
                  <SelectTrigger  className="w-full">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={String(c.country_id)} value={String(c.country_id)}>
                        {c.country_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="state_id" className="pb-3">State</Label>
                <Select
                  value={formData.state_id}
                  onValueChange={(v) => setField('state_id', v)}
                  disabled={!formData.country_id}
                >
                  <SelectTrigger  className="w-full">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={String(s.state_id)} value={String(s.state_id)}>
                        {s.state_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="district_id" className="pb-3">District / City</Label>
                <Select
                  value={formData.district_id}
                  onValueChange={(v) => setField('district_id', v)}
                  disabled={!formData.state_id}
                >
                  <SelectTrigger  className="w-full">
                    <SelectValue placeholder="Select a district or city" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={String(d.district_id)} value={String(d.district_id)}>
                        {d.district_name ?? d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postal_code" className="pb-3">Postal Code</Label>
                <Select
                  value={formData.postal_code}
                  onValueChange={(v) => setField('postal_code', v)}
                  disabled={!formData.district_id}
                >
                  <SelectTrigger  className="w-full">
                    <SelectValue placeholder="Select a postal code" />
                  </SelectTrigger>
                  <SelectContent>
                    {pincodes.map((p) => (
                      <SelectItem key={String(p.pincode)} value={String(p.pincode)}>
                        {p.postal_code ?? p.pincode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lat" className="pb-3">Latitude</Label>
                <Input
                  id="lat"
                  value={formData.lat}
                  onChange={(e) => setField('lat', e.target.value)}
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <Label htmlFor="lng" className="pb-3">Longitude</Label>
                <Input
                  id="lng"
                  value={formData.lng}
                  onChange={(e) => setField('lng', e.target.value)}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
          </div>

          {/* Available Time */}
          <div className="sm:col-span-2">
            <h3 className="text-md font-medium mb-2">Available Time</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-end">
              <div>
                <Label htmlFor="visiting_startTime" className="pb-3">Start Time</Label>
                <Input
                  id="visiting_startTime"
                  type="time"
                  value={formData.visiting_startTime}
                  onChange={(e) => setField('visiting_startTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="visiting_endTime" className="pb-3">End Time</Label>
                <Input
                  id="visiting_endTime"
                  type="time"
                  value={formData.visiting_endTime}
                  onChange={(e) => setField('visiting_endTime', e.target.value)}
                />
              </div>
              {/* <div>
                <Label htmlFor="available_status" className="pb-3">Available Status</Label>
                <RadioGroup
                  value={formData.available_status ? '1' : '0'}
                  onValueChange={(v) => setField('available_status', v === '1')}
                >
                  <div className="flex gap-2">
                    <RadioGroupItem value="1" id="available_status_1" />
                    <RadioGroupItem value="0" id="available_status_0" />
                  </div>
                </RadioGroup>
              </div> */}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push('/client')}>
            Cancel
          </Button>
          <Button onClick={handleSave}  style={{ backgroundColor: primaryColor, color: '#fff' }}>
            {clientId ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
