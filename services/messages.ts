import { supabase } from '@/lib/supabase';

export type ChatMessage = {
  id: string;
  activityId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
};

type MessageRow = {
  id: string;
  activity_id: string;
  sender_id: string;
  body: string | null;
  created_at: string | null;
};

type SenderRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

export async function getActivityMessages(
  activityId: string
): Promise<ServiceResponse<ChatMessage[]>> {
  try {
    const { data: messageRows, error: messageError } = await supabase
      .from('activity_messages')
      .select('id, activity_id, sender_id, body, created_at')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });

    if (messageError) {
      console.log('getActivityMessages.messages error', messageError);
      return { data: null, error: messageError };
    }

    const safeMessages = (messageRows ?? []) as MessageRow[];
    const senderIds = [...new Set(safeMessages.map((message) => message.sender_id))];
    const { data: senderRows, error: senderError } = senderIds.length
      ? await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds)
      : { data: [], error: null };

    if (senderError) {
      console.log('getActivityMessages.senders error', senderError);
      return { data: null, error: senderError };
    }

    const senderMap = new Map<string, SenderRow>(
      ((senderRows ?? []) as SenderRow[]).map((sender) => [sender.id, sender])
    );

    return {
      data: safeMessages.map((message) => mapMessageRow(message, senderMap.get(message.sender_id))),
      error: null,
    };
  } catch (error) {
    console.log('getActivityMessages unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function sendActivityMessage(
  activityId: string,
  senderId: string,
  body: string
): Promise<ServiceResponse<ChatMessage>> {
  try {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return { data: null, error: new Error('Message cannot be empty.') };
    }

    const { data: messageRow, error: insertError } = await supabase
      .from('activity_messages')
      .insert({
        activity_id: activityId,
        sender_id: senderId,
        body: trimmedBody,
      })
      .select('id, activity_id, sender_id, body, created_at')
      .single<MessageRow>();

    if (insertError) {
      console.log('sendActivityMessage.insert error', insertError);
      return { data: null, error: insertError };
    }

    const { data: senderRow, error: senderError } = await getSenderProfile(senderId);

    if (senderError) {
      return { data: null, error: senderError };
    }

    return {
      data: mapMessageRow(messageRow, senderRow),
      error: null,
    };
  } catch (error) {
    console.log('sendActivityMessage unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function getChatMessageById(
  messageId: string
): Promise<ServiceResponse<ChatMessage>> {
  try {
    const { data: messageRow, error: messageError } = await supabase
      .from('activity_messages')
      .select('id, activity_id, sender_id, body, created_at')
      .eq('id', messageId)
      .single<MessageRow>();

    if (messageError) {
      console.log('getChatMessageById.message error', messageError);
      return { data: null, error: messageError };
    }

    const { data: senderRow, error: senderError } = await getSenderProfile(messageRow.sender_id);

    if (senderError) {
      return { data: null, error: senderError };
    }

    return {
      data: mapMessageRow(messageRow, senderRow),
      error: null,
    };
  } catch (error) {
    console.log('getChatMessageById unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

async function getSenderProfile(senderId: string): Promise<ServiceResponse<SenderRow | null>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', senderId)
      .maybeSingle<SenderRow>();

    if (error) {
      console.log('getSenderProfile error', error);
      return { data: null, error };
    }

    return { data: data ?? null, error: null };
  } catch (error) {
    console.log('getSenderProfile unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

function mapMessageRow(message: MessageRow, sender?: SenderRow | null): ChatMessage {
  return {
    id: message.id,
    activityId: message.activity_id,
    senderId: message.sender_id,
    senderName: sender?.full_name?.trim() || 'New user',
    senderAvatar: sender?.avatar_url?.trim() || '',
    text: message.body?.trim() || '',
    createdAt: message.created_at ?? new Date().toISOString(),
  };
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown chat service error');
}
