'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DatePickerWithInput from '@/app/components/DatePickerWithInput';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { URLS } from '@/utils/urls';

/** ---------- Helpers ---------- */

const nowTimeStr = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const mergeDateAndTime = (date: Date, time: string): Date => {
  const [hh = '00', mm = '00', ss = '00'] = time.split(':');
  const merged = new Date(date);
  merged.setHours(Number(hh) || 0, Number(mm) || 0, Number(ss) || 0, 0);
  return merged;
};

const clampNumStr = (val: string, min: number, max: number) => {
  const n = Number(val);
  if (Number.isNaN(n)) return String(min);
  return String(Math.min(max, Math.max(min, Math.trunc(n))));
};

/** ---------- Types ---------- */

type Option = { value: string; label: string };
type NatureItem = { id: string; name: string };

interface ClientBE {
  client_id: string | number;
  firstName?: string;
  lastName?: string;
  name?: string;
}
interface WorkTypeBE {
  worktype_id: string | number;
  worktype_name?: string;
  status?: boolean;
}
interface JobTypeBE {
  jobtype_id: string | number;
  jobtype_name?: string;
  worktype_id?: string | number;
  status?: boolean;
}
interface NatureOfWorkBE {
  now_id: string | number;
  now_name?: string;
  now_status?: boolean;
}
interface RoleBE {
  role_id: string | number;
  role_slug?: string;
}
interface UserBE {
  user_id: string | number;
  name?: string;
  email?: string;
  role_id?: string | number;
  assigned_jobs?: number;
  can_assign?: boolean;
  available_slots?: number;
  available_time_label?: string;
}
interface ApiEnvelope<T> {
  data?: T;
}

type FormData = {
  client: string;
  referenceNumber: string;
  workType: string; // worktype_id
  jobType: string; // jobtype_id
  jobDescription: string;
  scheduleDate: Date | null;
  scheduleTime: string; // HH:mm:ss
  supervisor: string; // supervisor_id
  natureOfWork: string; // now_id
  durationDays: string;
  durationHours: string; // ≤ 24
  durationMinutes: string; // ≤ 59
  technician: string; // technician_id
  companyId: string; // company_id
};

type Technician = {
  user_id: string;
  name: string;
  assigned_jobs: number;
  can_assign: boolean;
  available_time_label: string;
};

type CSSVars = React.CSSProperties & { ['--primary']?: string };

/** ---------- Component ---------- */

export default function CreateJobPage() {
  const primaryColor = useSelector((state: RootState) => state.ui.primaryColor);
  const router = useRouter();

  // Safe read of currentUser from localStorage (client only)
  const [currentUser] = useState<any>(() => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const isSuperAdmin =
    (currentUser?.role?.slug || '').toLowerCase() === 'super_admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyOpts, setCompanyOpts] = useState<Option[]>([]);
  const [companyError, setCompanyError] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    client: '',
    referenceNumber: '',
    workType: '',
    jobType: '',
    jobDescription: '',
    scheduleDate: new Date(),
    scheduleTime: nowTimeStr(),
    supervisor: '',
    natureOfWork: '',
    durationDays: '',
    durationHours: '1',
    durationMinutes: '0',
    technician: '',
    companyId: '',
  });

  const [clientOpts, setClientOpts] = useState<Option[]>([]);
  const [workTypeOpts, setWorkTypeOpts] = useState<Option[]>([]);
  const [natureList, setNatureList] = useState<NatureItem[]>([]);
  const [supervisorOpts, setSupervisorOpts] = useState<Option[]>([]);

  const [jobTypeOpts, setJobTypeOpts] = useState<Option[]>([]);
  const [jobTypeLoading, setJobTypeLoading] = useState(false);

  const [techLoading, setTechLoading] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [hasSearchedTechs, setHasSearchedTechs] = useState(false);

  const handleChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'companyId') setCompanyError('');
  };

  const handleCancel = () => {
    router.push('/jobs');
  };

  /** (Optional) fetch companies if you have an endpoint.
   *  If not needed, you can remove this effect and pre-fill companyOpts from elsewhere.
   */
  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        // Replace with your own companies endpoint/URLS map
        const res = await api.get<
          ApiEnvelope<
            {
              company_id: string | number;
              company_name?: string;
              name?: string;
            }[]
          >
        >((URLS as any).GET_COMPANIES ?? '/companies', {
          params: { limit: 500 },
        });
        if (cancelled) return;
        const companies = res.data?.data ?? [];
        setCompanyOpts(
          companies.map((c) => ({
            value: String(c.company_id),
            label: String(c.company_name ?? c.name ?? c.company_id),
          }))
        );
      } catch (e) {
        console.error('Failed to load companies', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  // Init (base dropdowns)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [clientsRes, worksRes, nowsRes, rolesRes, usersRes] =
          await Promise.all([
            api.get<ApiEnvelope<ClientBE[]>>(URLS.GET_CLIENTS, {
              params: {
                available_status: true,
                limit: 200,
                company_id: formData.companyId || undefined,
              },
            }),
            api.get<ApiEnvelope<WorkTypeBE[]>>(URLS.GET_WORK_TYPES, {
              params: {
                status: true,
                limit: 200,
                company_id: formData.companyId || undefined,
              },
            }),
            api.get<ApiEnvelope<NatureOfWorkBE[]>>(URLS.GET_NATURE_OF_WORK, {
              params: {
                now_status: true,
                limit: 200,
                company_id: formData.companyId || undefined,
              },
            }),
            api.get<ApiEnvelope<RoleBE[]>>(URLS.GET_ROLES, {
              params: {
                limit: 200,
                company_id: formData.companyId || undefined,
              },
            }),
            api.get<ApiEnvelope<UserBE[]>>(URLS.GET_USERS, {
              params: {
                limit: 500,
                company_id: formData.companyId || undefined,
              },
            }),
          ]);
        if (cancelled) return;

        const clients = clientsRes.data?.data ?? [];
        const works = worksRes.data?.data ?? [];
        const nows = nowsRes.data?.data ?? [];
        const roles = rolesRes.data?.data ?? [];
        const users = usersRes.data?.data ?? [];

        setClientOpts(
          (clients as ClientBE[]).map((c) => ({
            value: String(c.client_id),
            label:
              [c.firstName, c.lastName].filter(Boolean).join(' ') ||
              c.name ||
              `#${c.client_id}`,
          }))
        );

        setWorkTypeOpts(
          (works as WorkTypeBE[]).map((w) => ({
            value: String(w.worktype_id),
            label: String(w.worktype_name ?? ''),
          }))
        );

        setNatureList(
          (nows as NatureOfWorkBE[]).map((n) => ({
            id: String(n.now_id),
            name: String(n.now_name ?? ''),
          }))
        );

        const supRole = (roles as RoleBE[]).find(
          (r) => String(r.role_slug ?? '').toLowerCase() === 'supervisor'
        );
        const supRoleId = supRole?.role_id;

        setSupervisorOpts(
          (users as UserBE[])
            .filter(
              (u) => !supRoleId || String(u.role_id) === String(supRoleId)
            )
            .map((u) => ({
              value: String(u.user_id),
              label: String(u.name ?? u.email ?? u.user_id),
            }))
        );
      } catch (e) {
        console.error('Failed to load initial options', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // re-run when company changes (super admin flow)
  }, [formData.companyId]);

  // Load Job Types on Work Type change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFormData((prev) => ({ ...prev, jobType: '' }));
      setJobTypeOpts([]);
      if (!formData.workType) return;
      try {
        setJobTypeLoading(true);
        const res = await api.get<ApiEnvelope<JobTypeBE[]>>(
          URLS.GET_JOB_TYPES,
          {
            params: {
              worktype_id: formData.workType,
              status: true,
              limit: 200,
              company_id: formData.companyId || undefined,
            },
          }
        );
        if (cancelled) return;
        const jobs = (res.data?.data ?? []) as JobTypeBE[];
        setJobTypeOpts(
          jobs.map((j) => ({
            value: String(j.jobtype_id),
            label: String(j.jobtype_name ?? ''),
          }))
        );
      } catch (e) {
        console.error('Failed to load job types for work type', e);
      } finally {
        if (!cancelled) setJobTypeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.workType, formData.companyId]);

  const selectedClientLabel = useMemo(
    () => clientOpts.find((o) => o.value === formData.client)?.label || '',
    [clientOpts, formData.client]
  );

  const onSearchTechnicians = async () => {
    // company validation for super admin
    if (isSuperAdmin && !formData.companyId) {
      setCompanyError('Please select a company first.');
      return;
    }

    try {
      setTechLoading(true);
      setHasSearchedTechs(false);
      setTechnicians([]);

      const res = await api.get<ApiEnvelope<UserBE[]>>('/admin/users', {
        params: {
          supervisor_id: formData.supervisor,
          company_id: formData.companyId || undefined,
        },
      });

      const raw = (res.data?.data ?? []) as UserBE[];
      setTechnicians(
        raw.map((u) => ({
          user_id: String(u.user_id),
          name: String(u.name ?? u.email ?? u.user_id),
          assigned_jobs:
            typeof u.assigned_jobs === 'number' ? u.assigned_jobs : 0,
          can_assign:
            typeof u.can_assign === 'boolean'
              ? u.can_assign
              : typeof u.available_slots === 'number'
              ? u.available_slots > 0
              : true,
          available_time_label:
            u.available_time_label ??
            (typeof u.available_slots === 'number'
              ? String(u.available_slots)
              : '—'),
        }))
      );

      setHasSearchedTechs(true);
    } catch (e) {
      console.error('Failed to search technicians', e);
      setHasSearchedTechs(true);
    } finally {
      setTechLoading(false);
    }
  };

  const showTechTable = hasSearchedTechs && technicians.length > 0;

  // duration clamps
  const onBlurHours = () =>
    setFormData((p) => ({
      ...p,
      durationHours: clampNumStr(p.durationHours, 0, 24),
    }));
  const onBlurMinutes = () =>
    setFormData((p) => ({
      ...p,
      durationMinutes: clampNumStr(p.durationMinutes, 0, 59),
    }));

  // NOTE: removed schedule (past-date) validation completely
  const actionsDisabled =
    saving ||
    techLoading ||
    (isSuperAdmin && !formData.companyId) ||
    !formData.client ||
    !formData.workType ||
    !formData.scheduleDate ||
    !formData.supervisor;

  const handleSave = async () => {
    // company validation for super admin
    if (isSuperAdmin && !formData.companyId) {
      setCompanyError('Please select a company to continue.');
      return;
    }

    // final clamp before send
    const estimated_days = Number(
      clampNumStr(formData.durationDays || '0', 0, 365)
    );
    const estimated_hours = Number(
      clampNumStr(formData.durationHours || '0', 0, 24)
    );
    const estimated_minutes = Number(
      clampNumStr(formData.durationMinutes || '0', 0, 59)
    );

    const scheduled = mergeDateAndTime(
      formData.scheduleDate!,
      formData.scheduleTime
    ).toISOString();

    // Build EXACT payload keys requested
    const payload = {
      // include company if your BE expects it for scoping
      company_id: formData.companyId || undefined,
      client_id: formData.client,
      technician_id: formData.technician || null, // allow null if not selected yet
      supervisor_id: formData.supervisor,
      worktype_id: formData.workType,
      jobtype_id: formData.jobType || null, // allow null if no job types
      now_id: formData.natureOfWork || null,
      estimated_days,
      estimated_hours,
      estimated_minutes,
      scheduledDateAndTime: scheduled, // ISO like "2025-08-20T10:30:00.000Z"
      job_description: formData.jobDescription || '',
      reference_number: formData.referenceNumber || '',
    };

    try {
      setSaving(true);
      await api.post('/jobs', payload);
      router.push('/jobs');
    } catch (e) {
      console.error('Failed to create job', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
        Create Job
      </h1>

      <Card className="p-4 md:p-6">
        <div className="border-b">
          <h3
            className="font-medium border-b-3 rounded-xs inline-block pb-1"
            style={{ color: primaryColor, borderColor: primaryColor }}
          >
            Assign Job to Technician
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Company (only for super_admin) */}
          {isSuperAdmin && (
            <div className="w-full">
              <Label className="pb-2">Company</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => handleChange('companyId', value)}
              >
                <SelectTrigger className="w-auto md:w-full">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companyOpts.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!!companyError && (
                <p className="text-xs text-red-600 mt-1">{companyError}</p>
              )}
            </div>
          )}

          {/* Client */}
          <div className="w-full">
            <Label className="pb-2">Select Client</Label>
            <Select
              value={formData.client}
              onValueChange={(value) => handleChange('client', value)}
              disabled={
                loading ||
                clientOpts.length === 0 ||
                (isSuperAdmin && !formData.companyId)
              }
            >
              <SelectTrigger className="w-auto md:w-full">
                <SelectValue
                  placeholder={
                    isSuperAdmin && !formData.companyId
                      ? 'Select company first'
                      : 'Select client'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {clientOpts.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!!selectedClientLabel && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {selectedClientLabel}
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div className="w-auto md:w-full">
            <Label className="pb-2">Reference Number</Label>
            <Input
              value={formData.referenceNumber}
              onChange={(e) => handleChange('referenceNumber', e.target.value)}
              placeholder="#ID34324342"
            />
          </div>

          {/* Work Type */}
          <div>
            <Label className="pb-2">Work Type</Label>
            <Select
              value={formData.workType}
              onValueChange={(value) => handleChange('workType', value)}
              disabled={
                loading ||
                workTypeOpts.length === 0 ||
                (isSuperAdmin && !formData.companyId)
              }
            >
              <SelectTrigger className="w-auto md:w-full">
                <SelectValue
                  placeholder={
                    isSuperAdmin && !formData.companyId
                      ? 'Select company first'
                      : 'Select work type'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {workTypeOpts.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Type — filtered by Work Type */}
          <div>
            <Label className="pb-2">Job Type</Label>
            <Select
              value={formData.jobType}
              onValueChange={(value) => handleChange('jobType', value)}
              disabled={
                jobTypeLoading || !formData.workType || jobTypeOpts.length === 0
              }
            >
              <SelectTrigger className="w-auto md:w-full">
                <SelectValue
                  placeholder={
                    jobTypeLoading
                      ? 'Loading job types...'
                      : !formData.workType
                      ? 'Select a work type first'
                      : jobTypeOpts.length === 0
                      ? 'No job types found'
                      : 'Select job type'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {jobTypeOpts.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Description */}
          <div>
            <Label className="pb-2">Job Description</Label>
            <Textarea
              placeholder="Describe the job"
              rows={3}
              value={formData.jobDescription}
              onChange={(e) => handleChange('jobDescription', e.target.value)}
            />
          </div>

          {/* Estimated Duration */}
          <div>
            <Label className="pb-2">Estimated Duration</Label>
            <div className="flex gap-2">
              <div>
                <Label className="text-xs">Days</Label>
                <Input
                  type="number"
                  placeholder="00"
                  className="w-16"
                  value={formData.durationDays}
                  onChange={(e) => handleChange('durationDays', e.target.value)}
                  min={0}
                />
              </div>
              <div>
                <Label className="text-xs">Hours (max 24)</Label>
                <Input
                  type="number"
                  placeholder="00"
                  className="w-16"
                  value={formData.durationHours}
                  onChange={(e) =>
                    handleChange('durationHours', e.target.value)
                  }
                  onBlur={onBlurHours}
                  min={0}
                  max={24}
                />
              </div>
              <div>
                <Label className="text-xs">Minutes (max 59)</Label>
                <Input
                  type="number"
                  placeholder="00"
                  className="w-16"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    handleChange('durationMinutes', e.target.value)
                  }
                  onBlur={onBlurMinutes}
                  min={0}
                  max={59}
                />
              </div>
            </div>
          </div>

          {/* Schedule (past allowed) */}
          <div>
            <Label className="pb-2">Schedule Date & Time</Label>
            <div className="flex flex-col gap-2">
              <DatePickerWithInput
                date={formData.scheduleDate ?? undefined}
                time={formData.scheduleTime}
                onChange={(nextDate, nextTime) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduleDate: nextDate ?? null,
                    scheduleTime: nextTime,
                  }))
                }
              />
              {formData.scheduleDate && (
                <p className="text-xs text-gray-500">
                  Scheduled at:{' '}
                  {mergeDateAndTime(
                    formData.scheduleDate,
                    formData.scheduleTime
                  ).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Supervisor */}
          <div>
            <Label className="pb-2">Select Supervisor</Label>
            <Select
              value={formData.supervisor}
              onValueChange={(value) => handleChange('supervisor', value)}
              disabled={
                loading ||
                supervisorOpts.length === 0 ||
                (isSuperAdmin && !formData.companyId)
              }
            >
              <SelectTrigger className="w-auto md:w-full">
                <SelectValue
                  placeholder={
                    isSuperAdmin && !formData.companyId
                      ? 'Select company first'
                      : 'Select supervisor'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {supervisorOpts.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nature of Work */}
          <div>
            <Label className="pb-2">Nature of Work</Label>
            <div className="flex justify-between flex-wrap gap-2">
              <RadioGroup
                value={formData.natureOfWork}
                onValueChange={(value) => handleChange('natureOfWork', value)}
                className="flex gap-6 mt-2 flex-wrap"
              >
                {natureList.map((n) => (
                  <div className="flex items-center space-x-2" key={n.id}>
                    <RadioGroupItem
                      value={n.id}
                      id={`now-${n.id}`}
                      className="data-[state=checked]:bg-[--primary]"
                      style={{ ['--primary']: primaryColor } as CSSVars}
                    />
                    <Label htmlFor={`now-${n.id}`}>{n.name}</Label>
                  </div>
                ))}
              </RadioGroup>

              {formData.supervisor && (
                <Button
                  type="button"
                  className="rounded-full button-click-effect cursor-pointer"
                  style={{ backgroundColor: primaryColor, color: 'white' }}
                  disabled={
                    techLoading ||
                    (isSuperAdmin && !formData.companyId) ||
                    !formData.client ||
                    !formData.workType ||
                    !formData.scheduleDate ||
                    !formData.supervisor
                  }
                  onClick={onSearchTechnicians}
                >
                  {techLoading ? (
                    'Searching…'
                  ) : (
                    <>
                      Search Technicians{' '}
                      <Image
                        src="/assets/technician_icon.svg"
                        alt="Technician"
                        width={18}
                        height={18}
                      />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Available Technicians */}
        {showTechTable && (
          <>
            <div className="border-b mt-4">
              <h3
                className="font-medium border-b-3 rounded-xs inline-block pb-1"
                style={{ color: primaryColor, borderColor: primaryColor }}
              >
                Available Technician
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left"> </th>
                    <th className="p-2 text-left">Technician Name</th>
                    <th className="p-2 text-left">Assigned Jobs</th>
                    <th className="p-2 text-left">Can Assign?</th>
                    <th className="p-2 text-left">Available Time</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((tech) => (
                    <tr key={tech.user_id} className="border-t">
                      <td className="p-2">
                        <input
                          type="radio"
                          name="technician"
                          checked={formData.technician === tech.user_id}
                          onChange={() =>
                            handleChange('technician', tech.user_id)
                          }
                          style={{ accentColor: primaryColor }}
                        />
                      </td>
                      <td className="p-2">{tech.name}</td>
                      <td className="p-2">{tech.assigned_jobs}</td>
                      <td className="p-2">{tech.can_assign ? 'Yes' : 'No'}</td>
                      <td className="p-2">{tech.available_time_label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {hasSearchedTechs && !techLoading && technicians.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">
            No technicians found for the selected supervisor.
          </p>
        )}

        <div className="flex justify-end gap-4 mt-4">
          <Button
            variant="destructive"
            onClick={handleCancel}
            className="cursor-pointer button-click-effect"
            type="button"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="text-white button-click-effect"
            style={{ backgroundColor: primaryColor }}
            type="button"
            disabled={
              saving ||
              (isSuperAdmin && !formData.companyId) ||
              !formData.client ||
              !formData.workType ||
              !formData.scheduleDate ||
              !formData.supervisor
            }
            onClick={handleSave}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
