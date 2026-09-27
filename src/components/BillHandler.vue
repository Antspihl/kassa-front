<template>
  <v-container>
    <h2>Arved</h2>
    <v-alert v-if="error && !mailDialog" type="error" class="my-3">{{ error }}</v-alert>
    <v-text-field v-model="search" label="Otsi nime järgi" clearable/>
    <v-data-table :items="bills" :headers="[{title:'Nimi',key:'name'},{title:'Arve',key:'bill'}]" :search="search" show-expand item-value="name">
      <template #item.bill="{ value }">{{ value }} €</template>
      <template #expanded-row="{columns,item}">
        <tr><td :colspan="columns.length"><div v-for="(count,drink) in item.drinks" :key="drink">{{ count }} × {{ drink }}</div></td></tr>
      </template>
    </v-data-table>
    <h3>Kokku: {{ total }} €</h3>

    <v-alert v-if="store.mode === 'paid'" type="info" class="mt-5">Selle õhtu tellimused tasuti kohapeal. E-posti arveid ei saadeta.</v-alert>
    <v-alert v-else-if="!store.isOrganizer" type="info" class="mt-5">Arvete saatmiseks logi seadete menüüs korraldajana sisse.</v-alert>
    <v-btn v-else-if="store.mode === 'unpaid'" color="primary" class="mt-5" @click="openMailDialog">Koosta ja saada e-kirju</v-btn>

    <v-dialog v-model="mailDialog" max-width="900" :persistent="busy" scrollable>
      <v-card>
        <v-card-title>E-kirjade saatmine</v-card-title>
        <v-card-text class="mail-dialog-content">
          <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

          <template v-if="mailStep === 'compose'">
            <p class="mb-4">Koosta ühine sisu. Seejärel näed iga saaja tervet kirja eraldi.</p>
            <v-select v-model="kind" :items="[{title:'Esimene arve',value:'initial'},{title:'Maksmise meeldetuletus',value:'reminder'}]" label="Kirja tüüp"/>
            <v-select v-if="kind === 'reminder' || retryOnly" v-model="selectedNames" :items="bills.map(b => b.name)" label="Saajad" multiple chips @update:model-value="resetPreview"/>
            <v-btn v-if="retryOnly && kind === 'initial'" variant="text" @click="retryOnly = false; selectedNames = []; resetPreview()">Näita taas kõiki saatmata arveid</v-btn>
            <v-text-field v-model="draft.subject" label="Pealkiri"/>
            <v-textarea v-model="draft.intro" label="Sissejuhatus"/>
            <v-text-field v-model="draft.deadline" label="Tasumise tähtaeg"/>
            <v-text-field v-model="draft.payee" label="Arve saaja"/>
            <v-text-field v-model="draft.account" label="Konto"/>
            <v-text-field v-model="draft.reference" label="Makse selgitus"/>
            <v-textarea v-model="draft.closing" label="Lõpetus"/>
            <v-select v-if="runs.length" :items="runOptions" label="Varasemad saatmised" @update:model-value="loadRun"/>
            <div v-if="statuses.length" class="mt-4">
              <h3>Saatmise olek</h3>
              <div v-for="entry in statuses" :key="entry.id">{{ entry.name }} ({{ entry.recipient }}): {{ entry.status }} {{ entry.error || '' }}</div>
              <v-btn v-if="statuses.some(s => s.status === 'failed')" class="mt-3" @click="retryFailed">Eelvaata ainult ebaõnnestunud saajaid</v-btn>
            </div>
          </template>

          <template v-else-if="mailStep === 'review' && preview">
            <div class="d-flex align-center justify-space-between mb-3">
              <h3>Kiri {{ reviewIndex + 1 }} / {{ preview.messages.length }}</h3>
              <span>Üle vaadatud {{ reviewedIds.length }} / {{ preview.messages.length }}</span>
            </div>
            <v-alert v-if="preview.skipped.length" type="warning" class="mb-3">{{ preview.skipped.length }} saajat jäetakse vahele. Paranda aadress või jätka ilma nendeta.</v-alert>
            <v-expansion-panels v-if="preview.skipped.length" class="mb-4">
              <v-expansion-panel title="Vahele jäetud saajad">
                <v-expansion-panel-text>
                  <div v-for="person in preview.skipped" :key="person.name" class="mb-4">
                    <strong>{{ person.name }}: {{ person.reason }}</strong>
                    <v-text-field v-model="recipientEdits[person.name]" label="Uus e-posti aadress"/>
                    <v-btn :disabled="busy" @click="saveRecipient(person.name)">Salvesta aadress</v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <template v-if="currentMessage">
              <div class="mb-2"><strong>Saaja:</strong> {{ currentMessage.name }} &lt;{{ currentMessage.recipient }}&gt;</div>
              <div class="mb-2"><strong>Pealkiri:</strong> {{ currentMessage.subject }}</div>
              <div class="mb-2"><strong>Arve:</strong> {{ currentMessage.total }} €</div>
              <v-sheet border rounded class="pa-4 mb-4 mail-body">{{ currentMessage.body }}</v-sheet>
              <v-text-field v-model="recipientEdits[currentMessage.name]" label="Muuda saaja aadressi"/>
              <v-btn v-if="recipientEdits[currentMessage.name] && recipientEdits[currentMessage.name] !== currentMessage.recipient" :disabled="busy" @click="saveRecipient(currentMessage.name)">Salvesta aadress</v-btn>
            </template>
          </template>

          <template v-else-if="mailStep === 'confirm'">
            <p class="mb-4">Oled kõik {{ preview?.messages.length || 0 }} kirja läbi vaadanud. Sisesta saatmiseks täpselt <strong>SAADA KÕIK EMAILID</strong>.</p>
            <v-text-field v-model="confirmation" label="Kinnitustekst" autocomplete="off"/>
          </template>

          <template v-else-if="mailStep === 'status'">
            <h3>Saatmise olek</h3>
            <div v-for="entry in statuses" :key="entry.id">{{ entry.name }} ({{ entry.recipient }}): {{ entry.status }} {{ entry.error || '' }}</div>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-btn :disabled="busy" @click="closeMailDialog">Sulge</v-btn>
          <v-spacer/>
          <template v-if="mailStep === 'compose'">
            <v-btn color="info" variant="elevated" class="text-white" :loading="busy" @click="makePreview">Kinnita sisu ja vaata kirju</v-btn>
          </template>
          <template v-else-if="mailStep === 'review'">
            <v-btn variant="text" @click="mailStep = 'compose'">Muuda sisu</v-btn>
            <v-btn icon="mdi-chevron-left" aria-label="Eelmine kiri" :disabled="reviewIndex === 0 || busy" @click="showMessage(reviewIndex - 1)"/>
            <v-btn v-if="preview && reviewIndex < preview.messages.length - 1" icon="mdi-chevron-right" aria-label="Järgmine kiri" :disabled="busy" @click="showMessage(reviewIndex + 1)"/>
            <v-btn v-else color="warning" :disabled="!allReviewed || busy" @click="mailStep = 'confirm'">Jätka saatmisega</v-btn>
          </template>
          <template v-else-if="mailStep === 'confirm'">
            <v-btn @click="mailStep = 'review'">Tagasi kirjade juurde</v-btn>
            <v-btn color="error" :disabled="confirmation !== 'SAADA KÕIK EMAILID' || !allReviewed" :loading="busy" @click="sendEmails">Saada e-kirjad</v-btn>
          </template>
          <template v-else-if="mailStep === 'status'">
            <v-btn v-if="statuses.some(s => s.status === 'failed')" @click="retryFailed">Eelvaata ebaõnnestunud saajaid</v-btn>
            <v-btn @click="mailStep = 'compose'">Koosta uus kiri</v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import axios from 'axios';
import {computed, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue';
import {API_URL, useMainStore} from '@/api/MainStore';

type Bill = {name: string; bill: string; drinks: Record<string, number>};
type Message = {id: string; name: string; recipient: string; subject: string; body: string; total: string};
type Preview = {id: string; messages: Message[]; skipped: {name: string; reason: string}[]};
type Status = {id: string; name: string; recipient: string; status: string; error?: string};
type Run = {preview_id: string; kind: string; recipients: number; last_sent_at?: string; pending: number; failed: number; unknown: number};
const store = useMainStore();
const bills = ref<Bill[]>([]);
const search = ref('');
const kind = ref<'initial' | 'reminder'>('initial');
const selectedNames = ref<string[]>([]);
const retryOnly = ref(false);
const draft = reactive({subject: 'Kõrtsi arve', intro: 'Palun tasu oma kõrtsi arve.', deadline: '', payee: '', account: '', reference: 'ülekanne', closing: 'Järgmise peoni,\nSoveldaja kõrtsmikkond'});
const preview = ref<Preview | null>(null);
const reviewedIds = ref<string[]>([]);
const recipientEdits = reactive<Record<string, string>>({});
const statuses = ref<Status[]>([]);
const runs = ref<Run[]>([]);
const mailDialog = ref(false);
const mailStep = ref<'compose' | 'review' | 'confirm' | 'status'>('compose');
const reviewIndex = ref(0);
const confirmation = ref('');
const busy = ref(false);
const error = ref('');
let pollTimer: number | undefined;
const total = computed(() => bills.value.reduce((sum, b) => sum + Number(b.bill), 0).toFixed(2));
const runOptions = computed(() => runs.value.map(r => {
  const kindLabel = r.kind === 'initial' ? 'Arve' : r.kind === 'reminder' ? 'Meeldetuletus' : r.kind;
  const sentAt = formatTimestamp(r.last_sent_at);
  const state = r.pending > 0 ? 'saatmine pooleli' : r.unknown > 0 ? 'kontrolli postkasti' : r.failed > 0 ? 'ebaõnnestus' : '';
  const details = [sentAt, state].filter(Boolean).join(' · ') || 'ootel';
  return {title: `${kindLabel} — ${r.recipients} saajat — ${details}`, value: r.preview_id};
}));
const currentMessage = computed(() => preview.value?.messages[reviewIndex.value]);
const allReviewed = computed(() => !!preview.value && preview.value.messages.length > 0 && preview.value.messages.every(m => reviewedIds.value.includes(m.id)));

function resetPreview() { preview.value = null; reviewedIds.value = []; reviewIndex.value = 0; confirmation.value = ''; }
function openMailDialog() {
  error.value = '';
  mailStep.value = 'compose';
  mailDialog.value = true;
}
function closeMailDialog() {
  if (busy.value) return;
  mailDialog.value = false;
  mailStep.value = 'compose';
  resetPreview();
}
function showMessage(index: number) {
  const message = preview.value?.messages[index];
  if (!message) return;
  reviewIndex.value = index;
  if (!reviewedIds.value.includes(message.id)) reviewedIds.value.push(message.id);
}
async function loadBills() {
  try { bills.value = (await axios.get(API_URL + '/bills')).data; }
  catch (e: any) { error.value = e?.response?.data?.error || 'Arvete laadimine ebaõnnestus'; }
}
async function makePreview() {
  error.value = ''; busy.value = true; mailStep.value = 'compose'; resetPreview();
  try {
    const response = await axios.post(API_URL + '/admin/mail/preview', {kind: kind.value, selectedNames: kind.value === 'reminder' || retryOnly.value ? selectedNames.value : undefined, ...draft});
    preview.value = response.data;
    for (const m of response.data.messages) recipientEdits[m.name] = m.recipient;
    if (response.data.messages.length) {
      mailStep.value = 'review';
      showMessage(0);
    }
  } catch (e: any) { error.value = e?.response?.data?.error || 'Eelvaade ebaõnnestus'; }
  finally { busy.value = false; }
}
async function saveRecipient(name: string) {
  error.value = ''; busy.value = true;
  try {
    await axios.put(API_URL + '/admin/recipient', {name, email: recipientEdits[name]});
    resetPreview();
    await makePreview();
  } catch (e: any) { error.value = e?.response?.data?.error || 'Aadressi salvestamine ebaõnnestus'; }
  finally { busy.value = false; }
}
async function pollStatus(id: string) {
  if (pollTimer) clearTimeout(pollTimer);
  try {
    statuses.value = (await axios.get(API_URL + '/admin/mail/status/' + id)).data;
    if (statuses.value.some(s => ['queued', 'sending'].includes(s.status))) pollTimer = window.setTimeout(() => pollStatus(id), 2000);
    else await loadRuns();
  } catch (e: any) { error.value = e?.response?.data?.error || 'Saatmise olekut ei saanud laadida'; }
}
async function loadRuns() {
  if (!store.isOrganizer) return;
  runs.value = (await axios.get(API_URL + '/admin/mail/runs')).data;
}
function loadRun(id: string) { if (id) pollStatus(id); }
function formatTimestamp(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
async function sendEmails() {
  if (!preview.value || !allReviewed.value || mailStep.value !== 'confirm' || confirmation.value !== 'SAADA KÕIK EMAILID') return;
  busy.value = true; error.value = '';
  try {
    const id = preview.value.id;
    await axios.post(API_URL + '/admin/mail/send', {previewId: id, reviewedIds: reviewedIds.value, confirmation: confirmation.value});
    resetPreview(); statuses.value = []; mailStep.value = 'status';
    await pollStatus(id);
    await loadRuns();
  } catch (e: any) { error.value = e?.response?.data?.error || 'Saatmine ebaõnnestus'; }
  finally { busy.value = false; }
}
function retryFailed() {
  selectedNames.value = statuses.value.filter(s => s.status === 'failed').map(s => s.name);
  retryOnly.value = true; resetPreview(); mailStep.value = 'compose';
}
watch(draft, value => { localStorage.setItem('billDraft', JSON.stringify(value)); resetPreview(); }, {deep: true});
watch(kind, value => {
  if (value === 'reminder' && draft.subject === 'Kõrtsi arve') draft.subject = 'Maksmise meeldetuletus';
  if (value === 'initial' && draft.subject === 'Maksmise meeldetuletus') draft.subject = 'Kõrtsi arve';
  retryOnly.value = false; selectedNames.value = []; resetPreview();
});
onMounted(async () => {
  try { Object.assign(draft, JSON.parse(localStorage.getItem('billDraft') || '{}')); } catch { /* ignore stale draft */ }
  loadBills(); await store.checkOrganizer(); store.loadMode(); await loadRuns();
});
onBeforeUnmount(() => { if (pollTimer) clearTimeout(pollTimer); });
</script>

<style scoped>
.mail-body { white-space: pre-wrap; overflow-wrap: anywhere; font-family: inherit; }
</style>
