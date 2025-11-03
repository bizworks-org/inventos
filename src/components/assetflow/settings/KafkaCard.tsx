import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';

export default function KafkaCard(props: {
  events: any;
  setEvents: (fn: any) => void;
  saveKafkaSettings: () => void;
}) {
  const { events, setEvents, saveKafkaSettings } = props;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Apache Kafka</CardTitle>
        </div>
        <CardDescription>Publish events to a Kafka topic.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-1 block">Bootstrap Servers</Label>
          <Input placeholder="broker1:9092,broker2:9092" value={events.kafkaBrokers} onChange={(e) => setEvents((v: any) => ({ ...v, kafkaBrokers: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-1 block">Topic Name</Label>
          <Input placeholder="assetflow.events" value={events.kafkaTopic} onChange={(e) => setEvents((v: any) => ({ ...v, kafkaTopic: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-1 block">Client ID</Label>
          <Input placeholder="assetflow-ui" value={events.kafkaClientId} onChange={(e) => setEvents((v: any) => ({ ...v, kafkaClientId: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-1 block">SASL Mechanism</Label>
          <select
            className="w-full px-3 py-2 rounded-lg bg-[#f8f9ff] border border-[rgba(0,0,0,0.08)]"
            value={events.kafkaSaslMechanism}
            onChange={(e) => setEvents((v: any) => ({ ...v, kafkaSaslMechanism: e.target.value as any }))}
          >
            <option value="none">None</option>
            <option value="plain">PLAIN</option>
            <option value="scram-sha-256">SCRAM-SHA-256</option>
            <option value="scram-sha-512">SCRAM-SHA-512</option>
          </select>
        </div>
        {events.kafkaSaslMechanism !== 'none' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Username</Label>
              <Input value={events.kafkaUsername} onChange={(e) => setEvents((v: any) => ({ ...v, kafkaUsername: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 block">Password</Label>
              <Input type="password" value={events.kafkaPassword} onChange={(e) => setEvents((v: any) => ({ ...v, kafkaPassword: e.target.value }))} />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end border-t">
        <Button type="button" className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6366f1]/30" onClick={saveKafkaSettings}>Save Kafka Settings</Button>
      </CardFooter>
    </Card>
  );
}
