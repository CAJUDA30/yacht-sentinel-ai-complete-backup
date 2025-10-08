import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CrewSchedule {
  id: string;
  crewMemberId: string;
  crewMemberName?: string;
  shiftDate: string;
  shiftType: 'morning' | 'afternoon' | 'night' | 'full_day';
  startTime: string;
  endTime: string;
  workload: number;
  efficiencyScore: number;
  assignedTasks: string[];
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const useCrewSchedules = (dateRange?: { start: string; end: string }) => {
  const [schedules, setSchedules] = useState<CrewSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      let query = supabase
        .from('crew_schedules')
        .select(`
          *,
          crew_members (
            name
          )
        `);

      if (dateRange) {
        query = query
          .gte('shift_date', dateRange.start)
          .lte('shift_date', dateRange.end);
      }

      const { data, error } = await query.order('shift_date', { ascending: true });

      if (error) throw error;

      const transformedSchedules: CrewSchedule[] = data.map(schedule => ({
        id: schedule.id,
        crewMemberId: schedule.crew_member_id,
        crewMemberName: schedule.crew_members?.name,
        shiftDate: schedule.shift_date,
        shiftType: schedule.shift_type as 'morning' | 'afternoon' | 'night' | 'full_day',
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        workload: schedule.workload,
        efficiencyScore: parseFloat(schedule.efficiency_score.toString()),
        assignedTasks: (schedule.assigned_tasks as string[]) || [],
        status: schedule.status as 'scheduled' | 'active' | 'completed' | 'cancelled',
        notes: schedule.notes,
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at
      }));

      setSchedules(transformedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load crew schedules');
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async (scheduleData: Omit<CrewSchedule, 'id' | 'createdAt' | 'updatedAt' | 'crewMemberName'>) => {
    try {
      const { data, error } = await supabase
        .from('crew_schedules')
        .insert({
          crew_member_id: scheduleData.crewMemberId,
          shift_date: scheduleData.shiftDate,
          shift_type: scheduleData.shiftType,
          start_time: scheduleData.startTime,
          end_time: scheduleData.endTime,
          workload: scheduleData.workload,
          efficiency_score: scheduleData.efficiencyScore,
          assigned_tasks: scheduleData.assignedTasks,
          status: scheduleData.status,
          notes: scheduleData.notes
        })
        .select()
        .single();

      if (error) throw error;

      await fetchSchedules(); // Refresh to get crew member name
      toast.success('Schedule created successfully');
      return data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
      throw error;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<CrewSchedule>) => {
    try {
      const { data, error } = await supabase
        .from('crew_schedules')
        .update({
          crew_member_id: updates.crewMemberId,
          shift_date: updates.shiftDate,
          shift_type: updates.shiftType,
          start_time: updates.startTime,
          end_time: updates.endTime,
          workload: updates.workload,
          efficiency_score: updates.efficiencyScore,
          assigned_tasks: updates.assignedTasks,
          status: updates.status,
          notes: updates.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchSchedules(); // Refresh to get updated data
      toast.success('Schedule updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
      throw error;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crew_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
      toast.success('Schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
      throw error;
    }
  };

  const optimizeSchedules = async () => {
    try {
      // Call AI optimization edge function
      const { data, error } = await supabase.functions.invoke('optimize-crew-schedules', {
        body: { dateRange }
      });

      if (error) throw error;

      await fetchSchedules(); // Refresh schedules
      toast.success('Schedules optimized successfully');
      return data;
    } catch (error) {
      console.error('Error optimizing schedules:', error);
      toast.error('Failed to optimize schedules');
      throw error;
    }
  };

  useEffect(() => {
    fetchSchedules();

    // Set up real-time subscription
    const channel = supabase
      .channel('crew_schedules_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'crew_schedules' },
        () => {
          fetchSchedules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateRange]);

  return {
    schedules,
    loading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    optimizeSchedules,
    refetch: fetchSchedules
  };
};