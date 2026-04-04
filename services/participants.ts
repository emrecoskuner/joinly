import { supabase } from '@/lib/supabase';

type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

export async function joinOrRequestActivity(
  activity_id: string,
  user_id: string,
  approval_mode: 'auto' | 'manual'
): Promise<ServiceResponse<{ activity_id: string; user_id: string; status: 'joined' | 'pending' }>> {
  try {
    const status = approval_mode === 'auto' ? 'joined' : 'pending';
    const { error } = await supabase.from('activity_participants').upsert(
      {
        activity_id,
        user_id,
        role: 'participant',
        status,
      },
      {
        onConflict: 'activity_id,user_id',
      }
    );

    if (error) {
      console.log('joinOrRequestActivity error', error);
      return { data: null, error };
    }

    return {
      data: {
        activity_id,
        user_id,
        status,
      },
      error: null,
    };
  } catch (error) {
    console.log('joinOrRequestActivity unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function leaveActivity(
  activity_id: string,
  user_id: string
): Promise<ServiceResponse<{ activity_id: string; user_id: string }>> {
  try {
    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activity_id)
      .eq('user_id', user_id);

    if (error) {
      console.log('leaveActivity error', error);
      return { data: null, error };
    }

    return {
      data: {
        activity_id,
        user_id,
      },
      error: null,
    };
  } catch (error) {
    console.log('leaveActivity unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function approveParticipant(
  activity_id: string,
  user_id: string
): Promise<ServiceResponse<{ activity_id: string; user_id: string }>> {
  try {
    const { error } = await supabase
      .from('activity_participants')
      .update({
        status: 'joined',
      })
      .eq('activity_id', activity_id)
      .eq('user_id', user_id);

    if (error) {
      console.log('approveParticipant error', error);
      return { data: null, error };
    }

    return {
      data: {
        activity_id,
        user_id,
      },
      error: null,
    };
  } catch (error) {
    console.log('approveParticipant unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function rejectParticipant(
  activity_id: string,
  user_id: string
): Promise<ServiceResponse<{ activity_id: string; user_id: string }>> {
  try {
    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activity_id)
      .eq('user_id', user_id);

    if (error) {
      console.log('rejectParticipant error', error);
      return { data: null, error };
    }

    return {
      data: {
        activity_id,
        user_id,
      },
      error: null,
    };
  } catch (error) {
    console.log('rejectParticipant unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function removeParticipant(
  activity_id: string,
  user_id: string
): Promise<ServiceResponse<{ activity_id: string; user_id: string }>> {
  try {
    const { error } = await supabase
      .from('activity_participants')
      .update({
        status: 'removed',
        updated_at: new Date().toISOString(),
      })
      .eq('activity_id', activity_id)
      .eq('user_id', user_id)
      .neq('role', 'host');

    if (error) {
      console.log('removeParticipant error', error);
      return { data: null, error };
    }

    return {
      data: {
        activity_id,
        user_id,
      },
      error: null,
    };
  } catch (error) {
    console.log('removeParticipant unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown service error');
}
