# me - this DAT
# scriptOp - the OP which is cooking

PyP100 = op('td_pip').ImportModule( "PyP100", pipPackageName = "git+https://github.com/almottier/TapoP100.git@main")
from PyP100 import PyP110
 
p110 = None

ipParam = None


def init():
	global p110, ipParam, connectedParam
	if p110 != None:
		p110 = None
	
	if ipParam == None:
		ipParam = op('p110').par.Ip
		
	ip = str(ipParam)
	usr = str(op('logs')[0,0])
	passw = str(op('logs')[1,0])
	print("connecting to", ip, ":" , usr, ':', passw)
	
	if ip == None:
		print("No IP set, must setup parameters before")
		return
		
	try:
		p110 = PyP110.P110(ip, usr, passw)
		print("connected")
	except:
		print("connection error")
	
	
	  # Creates a P100 plug object
	return
	
# press 'Setup Parameters' in the OP to call this function to re-create the parameters.
def onSetupParameters(scriptOp):
	global ipParam
	page = scriptOp.appendCustomPage('Custom')
	page.appendPulse('Init')
	page.appendPulse('Open')
	page.appendPulse('Close')
	p = page.appendStr('Ip')	
	ipParam = p[0]
	ipParam.default = "192.168.1.100"
	print("setup parameters", ipParam)
	return
	

def turnOn():
	if p110 == None:
		init()
	p110.turnOn()
	return
	
def turnOff():
	if p110 == None:
		init()
	p110.turnOff()
	return


# called whenever custom pulse parameter is pushed
def onPulse(par):
	if par.name == "Init":
		init()
	elif par.name == "Open":
		turnOn()
	elif par.name == "Close":
		turnOff()
	

	return

def onCook(scriptOp):
	scriptOp.clear()
	return
