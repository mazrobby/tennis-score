const prisma = require("../db/prisma")
module.exports = {
    async JadwalIndex(req, res) {
        const jadwal = await prisma.jadwalPertandingan.findMany({
            where: {
                is_deleted: 0
            }
        })
        res.json(jadwal)
    },

    async JadwalDetail(req, res) {
        const body = req.body
        const jadwal = await prisma.jadwalPertandingan.findUnique({
            where: {
                is_deleted: 0,
                id: body.id
            }
        })
        res.json(jadwal)
    },

    async JadwalSave(req, res) {
        const body = req.body

        try {
            if (body.player_satu == undefined) {
                res.status(404).json({
                    messages: "Player Satu tidak boleh kosong"
                })
            }
            if (body.player_dua == undefined) {
                res.status(404).json({
                    messages: "Player Dua tidak boleh kosong"
                })
            }
            if (body.room == undefined) {
                res.status(404).json({
                    messages: "Room tidak boleh kosong"
                })
            }
            if (body.tanggal == undefined) {
                res.status(404).json({
                    messages: "Tanggal tidak boleh kosong"
                })
            }
            if (body.jam == undefined) {
                res.status(404).json({
                    messages: "Jam tidak boleh kosong"
                })
            }

            if (body.id != undefined) {
                const findJadwal = await prisma.jadwalPertandingan.findUnique({ where: { id: body.id } })
                if (findJadwal) {
                    const jadwal = await prisma.jadwalPertandingan.update({
                        where: {
                            id: body.id
                        },
                        data: {
                            player_satu: body.player_satu,
                            player_dua: body.player_dua,
                            room: body.room,
                            tanggal: new Date(body.tanggal),
                            jam: body.jam
                        }
                    })

                    res.json(jadwal)
                } else {
                    res.status(404).json({
                        messages: "Jadwal pertandingan tidak ditemukan"
                    })
                }
            } else {
                const jadwal = await prisma.jadwalPertandingan.create({
                    data: {
                        player_satu: body.player_satu,
                        player_dua: body.player_dua,
                        room: body.room,
                        tanggal: new Date(body.tanggal),
                        jam: body.jam,
                        is_deleted: 0
                    }
                })

                res.json(jadwal)
            }
        } catch (error) {
            res.status(500).json(error)
        }
    },

    async JadwalHapus(req, res) {
        try {
            const body = req.body
            const jadwal = await prisma.jadwalPertandingan.findUnique({
                where: {
                    id: body.id
                }
            })

            if (jadwal) {
                await prisma.jadwalPertandingan.update({
                    where: {
                        id: body.id
                    },
                    data: {
                        is_deleted: 1
                    }
                })
                res.json({
                    messages: "Jadwal berhasil dihapus"
                })
            } else {
                res.status(404).json({
                    messages: "Jadwal tidak ditemukan"
                })
            }
        } catch (error) {
            res.status(500).json(error)
        }
    },

    async JadwalView(req, res) {
        let courts = ["1", "2", "3", "4", "5", "6"]
        let tanggals = await prisma.jadwalPertandingan.groupBy({
            by: ['tanggal'],
            where: {
                is_deleted: 0
            }
        })

        let output = []
        for (const element of tanggals) {

            let details = []
            for (const court_no of courts) {
                let matches = await prisma.jadwalPertandingan.findMany({
                    where: {
                        room: parseInt(court_no),
                        tanggal: element.tanggal,
                        is_deleted: 0
                    }
                })
                details.push({
                    court: parseInt(court_no),
                    match: matches
                })
            }

            let match_terbanyak = 0
            for (const item of details) {
                if (item.match.length >= match_terbanyak) {
                    match_terbanyak = item.match.length
                }
            }

            output.push({
                tanggal: element.tanggal,
                details: details,
                rowspan: match_terbanyak
            })
        }

        res.json(output)
    },

    async SimpanHasilPertandingan(req, res) {
        const body = req.body

        const jadwal = await prisma.jadwalPertandingan.findUnique({
            where: {
                id: body.id
            }
        })

        if (jadwal) {
            
            const simpan = await prisma.jadwalPertandingan.update({
                where: {
                    id: jadwal.id
                },
                data: {
                    data_json: body.data_json
                }
            })

            res.json({
                messages: "Simpan Hasil Pertandingan berhasil"
            })
        } else {
            res.status(404).json({
                messages : "Jadwal pertandingan tidak ditemukan"
            })
        }
    }
}