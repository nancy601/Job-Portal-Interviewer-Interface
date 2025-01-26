'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Card, CardContent } from './ui/card'
import { Plus, X, Clock, FileText, Users, Send, CheckCircle2, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useNavigate } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { useToastContext } from "./ui/use-toast"

interface Question {
  question: string
  points: number
}

interface Scenario {
  scenario_id: number
  scenario: string
  questions: Question[]
}

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  duration: string
  description: string
  invitees: string[]
  zoomLink?: string
  joinUrl?: string
  meetingId?: string
  meetingPassword?: string
  participants?: string[]
}

export default function Component() {
  const [compId, setCompId] = useState(2806)
  const [psyScenarios, setPsyScenarios] = useState<Scenario[]>([
    { scenario_id: 1, scenario: '', questions: [{ question: '', points: 0 }] }
  ])
  const [csScenarios, setCsScenarios] = useState<Scenario[]>([
    { scenario_id: 1, scenario: '', questions: [{ question: '', points: 0 }] }
  ])
  const [activePsyScenario, setActivePsyScenario] = useState(1)
  const [activeCsScenario, setActiveCsScenario] = useState(1)
  const [meetingData, setMeetingData] = useState<Meeting | null>(null)
  const [department, setDepartment] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('psycho')
  const [candidateEmails, setCandidateEmails] = useState<string[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [newMeeting, setNewMeeting] = useState<Meeting>({
    id: '',
    title: '',
    date: '',
    time: '',
    duration: '',
    description: '',
    invitees: []
  })
  const [newInvitee, setNewInvitee] = useState('')
  const [inviteeError, setInviteeError] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)
  const [emailErrors, setEmailErrors] = useState<string[]>([])
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false)
  const [apiGeneratedScenarios, setApiGeneratedScenarios] = useState<{
    psy_questions: Scenario[];
    case_study_questions: Scenario[];
  } | null>(null)
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false)
  const [showGeneratedScenarios, setShowGeneratedScenarios] = useState(false)
  const [generatedScenariosType, setGeneratedScenariosType] = useState<'psy' | 'cs' | null>(null)

  const navigate = useNavigate()
  const { toast } = useToastContext()

  useEffect(() => {
    fetchDepartments()
  }, [])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/get_departments')
      const data = await response.json()
      setDepartments(data.departments || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      setDepartments([])
    }
  }

  const scenarios = activeTab === 'psycho' ? psyScenarios : csScenarios
  const setScenarios = activeTab === 'psycho' ? setPsyScenarios : setCsScenarios
  const activeScenario = activeTab === 'psycho' ? activePsyScenario : activeCsScenario
  const setActiveScenario = activeTab === 'psycho' ? setActivePsyScenario : setActiveCsScenario

  const addScenario = (type: 'psy' | 'cs') => {
    const newId = scenarios.length + 1
    const newScenario = { scenario_id: newId, scenario: '', questions: [] }
    setScenarios([...scenarios, newScenario])
    setActiveScenario(newId)
  }

  const removeScenario = (type: 'psy' | 'cs', scenarioId: number) => {
    const updatedScenarios = scenarios.filter(s => s.scenario_id !== scenarioId)
    const renumberedScenarios = updatedScenarios.map((scenario, index) => ({
      ...scenario,
      scenario_id: index + 1
    }))
    setScenarios(renumberedScenarios)
    if (activeScenario === scenarioId) {
      setActiveScenario(Math.min(scenarioId, renumberedScenarios.length))
    } else if (activeScenario > scenarioId) {
      setActiveScenario(activeScenario - 1)
    }
  }

  const updateScenario = (type: 'psy' | 'cs', scenarioId: number, scenarioText: string) => {
    setScenarios(scenarios => scenarios.map(s => 
      s.scenario_id === scenarioId ? { ...s, scenario: scenarioText } : s
    ))
  }

  const addQuestion = (type: 'psy' | 'cs', scenarioId: number) => {
    setScenarios(scenarios => scenarios.map(scenario => {
      if (scenario.scenario_id === scenarioId) {
        return { 
          ...scenario, 
          questions: [...scenario.questions, { question: '', points: 0 }]
        }
      }
      return scenario
    }))
  }

  const removeQuestion = (type: 'psy' | 'cs', scenarioId: number, questionIndex: number) => {
    setScenarios(scenarios => scenarios.map(scenario => {
      if (scenario.scenario_id === scenarioId) {
        return {
          ...scenario,
          questions: scenario.questions.filter((_, index) => index !== questionIndex)
        }
      }
      return scenario
    }))
  }

  const updateQuestion = (type: 'psy' | 'cs', scenarioId: number, questionIndex: number, questionText: string, points: number) => {
    setScenarios(scenarios => scenarios.map(scenario => {
      if (scenario.scenario_id === scenarioId) {
        return {
          ...scenario,
          questions: scenario.questions.map((q, index) =>
            index === questionIndex ? { question: questionText, points } : q
          )
        }
      }
      return scenario
    }))
  }

  const handleScheduleMeeting = async () => {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time || !newMeeting.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsScheduling(true)

    try {
      const response = await fetch('https://support.peppypick.com/zoom/schedule_meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: newMeeting.title,
          start_time: newMeeting.date + 'T' + newMeeting.time + ':00Z',
          duration: newMeeting.duration,
          participants: newMeeting.invitees,
          agenda: newMeeting.description
        }),
      })
      const data = await response.json()
      
      if (response.ok && data.meeting_data) {
        setMeetingData(data.meeting_data)
        setMeetings(prevMeetings => [...prevMeetings, {
          ...newMeeting,
          id: data.meeting_data.id.toString(),
          zoomLink: data.meeting_data.join_url,
          joinUrl: data.meeting_data.join_url,
          meetingId: data.meeting_data.id.toString(),
          meetingPassword: data.meeting_data.password,
          participants: newMeeting.invitees
        }])
        setNewMeeting({
          id: '',
          title: '',
          date: '',
          time: '',
          duration: '',
          description: '',
          invitees: []
        })
        setNewInvitee('')
        toast({
          title: "Success",
          description: "Meeting scheduled successfully",
        })
      } else {
        throw new Error('Failed to schedule meeting')
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      toast({
        title: "Error",
        description: "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const addInvitee = () => {
    if (newInvitee && !newMeeting.invitees.includes(newInvitee)) {
      if (validateEmail(newInvitee)) {
        setNewMeeting({
          ...newMeeting,
          invitees: [...newMeeting.invitees, newInvitee]
        })
        setNewInvitee('')
        setInviteeError('')
      } else {
        setInviteeError('Please enter a valid email address')
      }
    }
  }

  const removeInvitee = (inviteeToRemove: string) => {
    setNewMeeting({
      ...newMeeting,
      invitees: newMeeting.invitees.filter(invitee => invitee !== inviteeToRemove)
    })
  }

  const addCandidateEmail = () => {
    setCandidateEmails(prevEmails => [...prevEmails, ''])
    setEmailErrors(prevErrors => [...prevErrors, ''])
  }

  const updateCandidateEmail = (index: number, email: string) => {
    const newEmails = [...candidateEmails]
    newEmails[index] = email
    setCandidateEmails(newEmails)

    const newErrors = [...emailErrors]
    if (email && !validateEmail(email)) {
      newErrors[index] = 'Invalid email format'
    } else {
      newErrors[index] = ''
    }
    setEmailErrors(newErrors)
  }

  const removeCandidateEmail = (index: number) => {
    setCandidateEmails(candidateEmails.filter((_, i) => i !== index))
    setEmailErrors(emailErrors.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/add_promote_questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comp_id: compId,
          department,
          psy_questions: psyScenarios,
          case_study_questions: csScenarios,
          candidate_emails: candidateEmails.filter(email => email.trim() !== ''),
          group_discussions: meetingData ? meetingData : []
        }),
      })
      const data = await response.json()
      console.log('Submission successful:', data)
      if (data.job_id) {
        setAssessmentSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting assessment:', error)
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchApiGeneratedScenarios = async (type: 'psy' | 'cs') => {
    if (!department) {
      toast({
        title: "Error",
        description: "Please select a department first",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingScenarios(true)
    try {
      const response = await fetch('http://127.0.0.1:5000/generate_assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ department, type }),
      })
      const data = await response.json()
      setApiGeneratedScenarios(prevState => {
        if (prevState === null) {
          return {
            psy_questions: type === 'psy' ? data.psy_questions : [],
            case_study_questions: type === 'cs' ? data.case_study_questions : []
          }
        }
        return {
          ...prevState,
          [type === 'psy' ? 'psy_questions' : 'case_study_questions']: 
            data[type === 'psy' ? 'psy_questions' : 'case_study_questions']
        }
      })
      setShowGeneratedScenarios(true)
      setGeneratedScenariosType(type)
      toast({
        title: "Success",
        description: `Generated ${type === 'psy' ? 'psychometric' : 'case study'} scenarios and questions successfully`,
      })
    } catch (error) {
      console.error('Error generating scenarios:', error)
      toast({
        title: "Error",
        description: `Failed to generate ${type === 'psy' ? 'psychometric' : 'case study'} scenarios and questions. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingScenarios(false)
    }
  }

  const renderScenarioSection = (type: 'psy' | 'cs') => {
    return (
      <>
        <div className="space-y-4">
          <Card className="p-2">
            <Select onValueChange={setDepartment} value={department}>
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <div className="flex space-x-2">
            <Button
              onClick={() => addScenario(type)}
              className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-white"
              variant="custom"
            >
              <Plus className="w-4 h-4 mr-2" />
              Scenario
            </Button>
            <Button
              onClick={() => fetchApiGeneratedScenarios(type)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              variant="custom"
              disabled={isGeneratingScenarios}
            >
              {isGeneratingScenarios ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Generate
            </Button>
          </div>

          {scenarios.map((scenario) => (
            <div key={scenario.scenario_id} className="relative">
              <Button
                variant={activeScenario === scenario.scenario_id ? "default" : "outline"}
                onClick={() => setActiveScenario(scenario.scenario_id)}
                className={`w-full justify-start pr-10 ${activeScenario === scenario.scenario_id ? 'bg-orange-500 text-white' : ''}`}
              >
                Scenario {scenario.scenario_id}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeScenario(type, scenario.scenario_id)}
                className="absolute right-0 top-0 bottom-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Remove Scenario {scenario.scenario_id}</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="col-span-3">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {type === 'psy' ? 'Psychometric Assessment' : 'Case Study'} - Scenario {activeScenario}
              </h2>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Enter scenario description"
                value={scenarios.find(s => s.scenario_id === activeScenario)?.scenario || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateScenario(type, activeScenario, e.target.value)}
                className="w-full"
              />

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Questions related to the scenario</h3>
                <Button
                  onClick={() => addQuestion(type, activeScenario)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  variant="custom"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  QUESTION
                </Button>
              </div>

              <ScrollArea className="h-[60vh] pr-4 rounded-lg border">
                <div className="p-4 space-y-4">
                  {scenarios
                    .find(s => s.scenario_id === activeScenario)
                    ?.questions.map((question, index) => (
                      <div key={index} className="flex items-start space-x-2 p-4 bg-muted/30 rounded-lg">
                        <div className="flex-grow space-y-2">
                          <Input
                            value={question.question}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(type, activeScenario, index, e.target.value, question.points)}
                            className="flex-grow"
                            placeholder="Enter question text"
                          />
                          <div className="flex items-center space-x-2">
                            <label htmlFor={`points-${index}`} className="text-sm font-medium">Points:</label>
                            <Input
                              id={`points-${index}`}
                              type="number"
                              value={question.points}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(type, activeScenario, index, question.question, Number(e.target.value))}
                              className="w-20"
                              placeholder="Points"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(type, activeScenario, index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                          <span className="sr-only">Remove Question</span>
                        </Button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </Card>
        </div>
      </>
    )
  }

  if (assessmentSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Created Successfully</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        if (value !== 'psycho' && value !== 'cs') {
          setShowGeneratedScenarios(false)
          setGeneratedScenariosType(null)
        } else {
          setGeneratedScenariosType(value === 'psycho' ? 'psy' : 'cs')
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="psycho" className="flex items-center gap-2 text-orange-500">
            <FileText className="w-4 h-4" />
            Psycho
          </TabsTrigger>
          <TabsTrigger value="cs" className="flex items-center gap-2 text-orange-500">
            <FileText className="w-4 h-4" />
            CS
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center gap-2 text-orange-500">
            <Users className="w-4 h-4" />
            Group Discussion
          </TabsTrigger>
          <TabsTrigger value="submit" className="flex items-center gap-2 text-orange-500">
            <Send className="w-4 h-4" />
            Submit
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-4 gap-4">
        {activeTab === 'psycho' && renderScenarioSection('psy')}
        {activeTab === 'cs' && renderScenarioSection('cs')}
        {activeTab === 'group' && (
          <div className="col-span-4">
            <Card className="p-6">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Schedule a Meeting</h2>
                  <p className="text-muted-foreground mb-6">
                    Fill in the details to schedule a new meeting and invite team members.
                  </p>
                  
                  <div className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="meeting-title" className="text-sm font-medium">Meeting Title</label>
                        <Input
                          id="meeting-title"
                          placeholder="Enter meeting title"
                          value={newMeeting.title}
                          onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="meeting-date" className="text-sm font-medium">Date</label>
                        <Input
                          id="meeting-date"
                          type="date"
                          value={newMeeting.date}
                          onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="meeting-time" className="text-sm font-medium">Time</label>
                        <Input
                          id="meeting-time"
                          type="time"
                          value={newMeeting.time}
                          onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="meeting-duration" className="text-sm font-medium">Duration</label>
                        <Select
                          value={newMeeting.duration}
                          onValueChange={(value) => setNewMeeting({ ...newMeeting, duration: value })}
                        >
                          <SelectTrigger id="meeting-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="meeting-description" className="text-sm font-medium">Description</label>
                      <Textarea
                        id="meeting-description"
                        placeholder="Enter meeting description"
                        value={newMeeting.description}
                        onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <label htmlFor="invitee-input" className="text-sm font-medium">Invite Team Members</label>
                      <div className="flex gap-2">
                        <Input
                          id="invitee-input"
                          placeholder="Enter name or email"
                          value={newInvitee}
                          onChange={(e) => setNewInvitee(e.target.value)}
                        />
                        <Button onClick={addInvitee} className="shrink-0 bg-orange-500">
                          <Plus className="w-4 h-4" />
                          <span className="sr-only">Add invitee</span>
                        </Button>
                      </div>
                      {inviteeError && (
                        <p className="text-red-500 text-sm mt-1">{inviteeError}</p>
                      )}

                      {newMeeting.invitees.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {newMeeting.invitees.map((invitee, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md"
                            >
                              <span className="text-sm">{invitee}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                onClick={() => removeInvitee(invitee)}
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove {invitee}</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleScheduleMeeting} 
                      className="w-full bg-orange-400"
                      disabled={isScheduling}
                    >
                      {isScheduling ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        'Schedule Meeting'
                      )}
                    </Button>
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Scheduled Meetings</h2>
                      <p className="text-muted-foreground mb-6">
                        View and manage your scheduled meetings.
                      </p>
                      
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Invitees</TableHead>
                              <TableHead>Zoom Link</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {meetings.map((meeting) => (
                              <TableRow key={meeting.id}>
                                <TableCell className="font-medium">{meeting.title}</TableCell>
                                <TableCell>
                                  {new Date(`${meeting.date} ${meeting.time}`).toLocaleString()}
                                </TableCell>
                                <TableCell>{meeting.duration} minutes</TableCell>
                                <TableCell>{meeting.invitees.join(', ')}</TableCell>
                                <TableCell>
                                  <a
                                    href={meeting.zoomLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    Join Meeting
                                  </a>
                                </TableCell>
                              </TableRow>
                            ))}
                            {meetings.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                  No meetings scheduled
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        {activeTab === 'submit' && (
          <div className="col-span-4">
            <Card className="p-4">
              <h2 className="text-xl font-bold mb-4">Submit Assessment</h2>
              <div className="space-y-4 mb-4">
                <h3 className="text-lg font-semibold">Candidate Emails</h3>
                {candidateEmails.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCandidateEmail(index, e.target.value)}
                      placeholder="Enter candidate email"
                      className="flex-grow"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCandidateEmail(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                      <span className="sr-only">Remove Email</span>
                    </Button>
                  </div>
                ))}
                <Button onClick={addCandidateEmail} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" variant="custom">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Candidate Email
                </Button>
              </div>
              <Button onClick={handleSubmit} className="w-full bg-orange-400 hover:bg-orange-500">
                Confirm Submission
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Generated Scenarios Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg transform transition-all duration-300 ease-in-out overflow-y-auto ${
          showGeneratedScenarios ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Generated Scenarios</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowGeneratedScenarios(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          {apiGeneratedScenarios && (
            <div className="space-y-4">
              {generatedScenariosType === 'psy' && apiGeneratedScenarios.psy_questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Psychometric Questions</h3>
                  {apiGeneratedScenarios.psy_questions.map((scenario, index) => (
                    <div key={index} className="mb-4 p-4 border rounded" style={{ backgroundColor: 'oldlace' }}>
                      <h4 className="font-medium" style={{ background: '#f873168a', padding: '0px 16px', border: '0', borderRadius: '6px' }}>Scenario {scenario.scenario_id}</h4>
                      <p className="mb-2">{scenario.scenario}</p>
                      <ul className="list-disc pl-5">
                        {scenario.questions.map((q, qIndex) => (
                          <li key={qIndex}>{q.question}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {generatedScenariosType === 'cs' && apiGeneratedScenarios.case_study_questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Case Study Questions</h3>
                  {apiGeneratedScenarios.case_study_questions.map((scenario, index) => (
                    <div key={index} className="mb-4 p-4 border rounded">
                      <h4 className="font-medium">Scenario {scenario.scenario_id}</h4>
                      <p className="mb-2">{scenario.scenario}</p>
                      <ul className="list-disc pl-5">
                        {scenario.questions.map((q, qIndex) => (
                          <li key={qIndex}>{q.question}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}