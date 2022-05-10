import pandas as pd

file1 = {
	"name": 'data/2s18-21.csv',
	# "colnames": ['2spit','player_id','full_name', 'season', 'totpit', '2spitpct', '2savg', '2siso', '2sbabip', '2sslg', 'k','l','m','n','2sab'],
	# "usecols": [i for i in range(10)]+[14]
}
file2 = {
	"name": 'data/fullstats17-21.csv'
}
output = 'data/combinedData.csv'

df1 = pd.read_csv(file1['name'])
df2 = pd.read_csv(file2['name'])

comboDF = df1

i = 0
j = 0
while i < len(comboDF):
	# row = comboDF.loc[[i]]
	# check = df2.loc[[j]]
	# print(row)
	# print(check)
	# print(row.loc('player_id'))
	# print(check.loc('player_id'))
	while (not df2.at[j, "player_id"] == comboDF.at[i, "player_id"]) or (not df2.at[j, "season"] == comboDF.at[i, "season"]):
		j += 1
		check = df2.loc[[j]]
	# found the right row, now add the data
	newCols = ['pa', 'kpct', 'bbpct', 'avg', 'slg', 'obp', 'ozspct', 'whiffpct', 'swpct']
	for key in newCols:
		comboDF.loc[i, key] = df2.at[j, key]
	# iterate for next loop
	i += 1

comboDF.to_csv(output, index=False, na_rep='', encoding='utf-8-sig')
print("file created: "+output)
print(comboDF.loc[[0]])

